"use server";

// ============================================================================
// midia/actions.ts — Server Actions da guia Mídia (fotos e vídeos da galeria)
// ============================================================================
// RUNTIME: Node (Server Action). Espelha noticias/actions.ts: cada action
// revalida a sessão com getSession() (fronteira de segurança real, fora de
// try/catch), trata erros do Prisma sem estourar 500, e revalida /admin/midia
// + /galeria após mutar.
//
// Fotos podem vir como ARQUIVO (upload local, otimizado com sharp e gravado em
// public/uploads) ou como URL externa. Vídeos são sempre uma URL de embed
// (YouTube normalizado para /embed/ quando dá).
//
// ATENÇÃO (fora do meu escopo): uploads grandes exigem elevar
// `experimental.serverActions.bodySizeLimit` no next.config (o padrão do Next é
// 1MB). Sem isso, o POST de um arquivo de vários MB é rejeitado ANTES de chegar
// aqui. A checagem de 12MB abaixo é a validação da aplicação, não o limite do
// framework.
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { uploadImage, deleteImage, isStorageUrl } from "@/lib/storage";

/** Estado do formulário — erro de validação consumido por useActionState. */
export type MediaFormState = { error: string | null };

// Lê um campo do FormData SÓ como string (espelha noticias/actions.ts). Um
// <input type=file> chega como File — qualquer coisa que não seja string vira ""
// (tratada como campo vazio).
function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value !== "string" ? "" : value.trim();
}

// Revalida as duas rotas afetadas por qualquer mudança em Media: a guia do
// admin e a galeria pública (que só mostra published:true).
function revalidateMedia(): void {
  revalidatePath("/admin/midia");
  revalidatePath("/galeria");
}

// Tamanho máximo do arquivo de imagem aceito (validação da aplicação).
const MAX_IMAGE_BYTES = 12 * 1024 * 1024; // ~12MB
const ALLOWED_IMAGE_EXT = ["jpg", "jpeg", "png", "webp", "avif"];

// Extrai o ID de 11 chars de uma URL do YouTube (watch?v=, youtu.be/, /embed/).
// Retorna null se não for YouTube reconhecível.
function extractYouTubeId(raw: string): string | null {
  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(raw);
    if (match) return match[1];
  }
  return null;
}

// Normaliza URL de vídeo: YouTube (watch/youtu.be/shorts) → URL de embed. Outras
// URLs (Vimeo, arquivo .mp4, embed já pronto) passam intactas.
function normalizeVideoUrl(raw: string): string {
  const id = extractYouTubeId(raw);
  return id ? `https://www.youtube.com/embed/${id}` : raw;
}

// Espelha safeUrl de noticias/actions.ts, mas aceita TAMBÉM o caminho interno
// "/uploads/..." gerado pelo upload local. `src`/`poster` vão direto para
// <Image src>/<video>: uma URL SEM protocolo faz o next/image LANÇAR e derruba
// a /galeria; esquemas perigosos (javascript:, data:) também são recusados.
// Aceita string vazia (→ null), URL http(s) ou "/uploads/...". Retorna `false`
// = inválido (erro claro ao usuário; nada é gravado).
function safeMediaUrl(value: string): string | null | false {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/uploads/")) return value;
  return false;
}

// Otimiza a imagem enviada com sharp (auto-orient pelo EXIF, maior lado ~1600px
// sem ampliar, WebP q80) e SOBE ao Supabase Storage (bucket público "media").
// Retorna a URL PÚBLICA — persiste em serverless, ao contrário de public/uploads.
async function saveUploadedImage(file: File): Promise<string> {
  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const outputBuffer = await sharp(inputBuffer)
    .rotate() // aplica a orientação do EXIF e a remove (fotos de celular)
    .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  return uploadImage(`${randomUUID()}.webp`, outputBuffer, "image/webp");
}

/**
 * Cria uma mídia (foto ou vídeo). Assinatura de useActionState: (prevState,
 * formData). Retorna `{ error }` com mensagem clara em qualquer falha de
 * validação/IO; em sucesso, revalida e redireciona para a guia (o formulário
 * reseta na re-renderização).
 */
export async function createMedia(
  _prev: MediaFormState,
  formData: FormData,
): Promise<MediaFormState> {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const type = field(formData, "type");
  if (type !== "photo" && type !== "video") {
    return { error: "Selecione o tipo da mídia (foto ou vídeo)." };
  }

  const title = field(formData, "title") || null;
  const srcField = field(formData, "src");

  let finalSrc: string;
  let poster: string | null = null;

  if (type === "video") {
    if (!srcField) {
      return { error: "Informe a URL do vídeo (YouTube ou embed)." };
    }
    // `src` vai direto para <iframe>/<video src>: valida http(s):// (ou o
    // caminho interno /uploads/) para não gravar URL sem protocolo nem esquema
    // perigoso. normalizeVideoUrl já pode ter convertido o YouTube para embed.
    const validatedSrc = safeMediaUrl(normalizeVideoUrl(srcField));
    if (!validatedSrc) {
      return { error: "A URL do vídeo deve começar com http(s)://." };
    }
    finalSrc = validatedSrc;
    // Poster (opcional) também vira <video poster>/<Image src>: mesma validação.
    const validatedPoster = safeMediaUrl(field(formData, "poster"));
    if (validatedPoster === false) {
      return {
        error: "O poster do vídeo deve ser uma URL http(s) válida (ou ficar vazio).",
      };
    }
    poster = validatedPoster;
  } else {
    // FOTO: preferimos o arquivo enviado; senão, a URL externa.
    const fileEntry = formData.get("file");
    const file =
      fileEntry && typeof fileEntry !== "string" && fileEntry.size > 0
        ? fileEntry
        : null;

    if (file) {
      if (file.size > MAX_IMAGE_BYTES) {
        return { error: "Imagem muito grande. O tamanho máximo é 12 MB." };
      }
      const ext = (file.name.split(".").pop() ?? "").toLowerCase();
      const looksLikeImage =
        file.type.startsWith("image/") || ALLOWED_IMAGE_EXT.includes(ext);
      if (!looksLikeImage) {
        return {
          error: "Envie um arquivo de imagem válido (JPG, PNG, WebP ou AVIF).",
        };
      }
      try {
        finalSrc = await saveUploadedImage(file);
      } catch (error) {
        console.error("Falha ao processar a imagem enviada.", error);
        return {
          error: "Não foi possível processar a imagem. Tente outro arquivo.",
        };
      }
    } else if (srcField) {
      // Foto por URL externa: vai direto para <Image src>, que LANÇA numa URL
      // sem protocolo e derruba a /galeria. Aceita só http(s):// (ou /uploads/).
      const validatedSrc = safeMediaUrl(srcField);
      if (!validatedSrc) {
        return {
          error: "A URL da foto deve começar com http(s):// (ou envie um arquivo).",
        };
      }
      finalSrc = validatedSrc;
    } else {
      return { error: "Envie um arquivo de imagem ou informe a URL da foto." };
    }
  }

  try {
    // `order` = maior order atual + 1 (novos itens entram no fim da lista).
    const aggregate = await prisma.media.aggregate({ _max: { order: true } });
    const order = (aggregate._max.order ?? 0) + 1;

    await prisma.media.create({
      data: { type, title, src: finalSrc, poster, order, published: true },
    });
  } catch (error) {
    console.error("Falha ao salvar mídia.", error);
    return { error: "Não foi possível salvar a mídia. Tente novamente." };
  }

  revalidateMedia();
  // redirect() lança NEXT_REDIRECT — precisa ficar FORA de try/catch.
  redirect("/admin/midia");
}

/**
 * Exclui uma mídia. Se o `src` for um upload local ("/uploads/…"), tenta apagar
 * o arquivo do disco (best-effort: sumiço/erro não é fatal). A identidade vem do
 * id vinculado no servidor (deleteMedia.bind(null, id)), não do payload.
 */
export async function deleteMedia(id: string): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  try {
    const media = await prisma.media.delete({ where: { id } });
    if (isStorageUrl(media.src)) {
      // Objeto no Supabase Storage → apaga do bucket (best-effort).
      await deleteImage(media.src);
    } else if (media.src.startsWith("/uploads/")) {
      // Legado (upload local antigo): apaga do disco. basename() descarta
      // qualquer componente de diretório → sem path traversal.
      const filePath = path.join(
        process.cwd(),
        "public",
        "uploads",
        path.basename(media.src),
      );
      await unlink(filePath).catch(() => {});
    }
  } catch (error) {
    // Registro já removido / id inexistente não é fatal (a lista revalidada já
    // reflete o estado real).
    console.error("Falha ao excluir mídia.", error);
  }

  revalidateMedia();
}

/** Alterna published (publicar ↔ ocultar). id vinculado no servidor. */
export async function togglePublished(id: string): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  try {
    const media = await prisma.media.findUnique({ where: { id } });
    if (media) {
      await prisma.media.update({
        where: { id },
        data: { published: !media.published },
      });
    }
  } catch (error) {
    console.error("Falha ao alternar publicação da mídia.", error);
  }

  revalidateMedia();
}

/**
 * Reordena uma mídia trocando seu `order` com o do vizinho do MESMO tipo
 * (subir/descer na lista). Sem vizinho (extremo da lista), é no-op.
 */
export async function moveMedia(id: string, dir: "up" | "down"): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  try {
    const current = await prisma.media.findUnique({ where: { id } });
    if (current) {
      const neighbor = await prisma.media.findFirst({
        where:
          dir === "up"
            ? { type: current.type, order: { lt: current.order } }
            : { type: current.type, order: { gt: current.order } },
        orderBy: { order: dir === "up" ? "desc" : "asc" },
      });
      if (neighbor) {
        // Troca atômica dos dois `order` (não há unique em order → seguro).
        await prisma.$transaction([
          prisma.media.update({
            where: { id: current.id },
            data: { order: neighbor.order },
          }),
          prisma.media.update({
            where: { id: neighbor.id },
            data: { order: current.order },
          }),
        ]);
      }
    }
  } catch (error) {
    console.error("Falha ao reordenar mídia.", error);
  }

  revalidateMedia();
}
