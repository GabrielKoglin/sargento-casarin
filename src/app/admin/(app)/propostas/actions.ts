"use server";

// ============================================================================
// admin/(app)/propostas/actions.ts — Server Actions do CRUD de propostas
// ============================================================================
// Regras de ouro deste arquivo:
//  1. SEGURANÇA: a PRIMEIRA linha de TODA action é o guard de sessão
//     (getSession()). É defesa em profundidade — o Proxy (src/proxy.ts) já
//     barra /admin/*, mas uma Server Action pode ser invocada de qualquer
//     rota, então revalidamos aqui também.
//  2. redirect() lança NEXT_REDIRECT: fica SEMPRE fora de try/catch.
//  3. SLUG único: pré-checamos com findUnique (mensagem amigável) E, por
//     segurança contra corrida, tratamos o erro P2002 do Prisma no create/
//     update — nunca deixamos estourar um 500.
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Prisma } from "@/generated/prisma/client";
import { optimizeAndUploadImage } from "@/lib/image-upload";
import { deleteImage, isStorageUrl } from "@/lib/storage";
import { slugify } from "./slug";

// Teto do arquivo enviado. A imagem é reduzida no navegador antes do envio
// (proposal-form.tsx); este guard só protege contra um envio direto sem JS.
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/**
 * Resolve a imagem final: se veio um ARQUIVO no campo `imageFile`, otimiza +
 * sobe ao storage e usa a URL pública; senão mantém `fallback` (a URL digitada
 * no campo de texto, ou a imagem atual em edição). Nunca lança — devolve estado
 * de erro amigável para o formulário.
 */
async function resolveImage(
  formData: FormData,
  fallback: string | null,
): Promise<{ ok: true; image: string | null } | { ok: false; state: ProposalFormState }> {
  const file = formData.get("imageFile");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: true, image: fallback };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, state: { fieldErrors: { imageFile: "Envie um arquivo de imagem válido." } } };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, state: { fieldErrors: { imageFile: "Imagem muito grande. Envie uma foto menor." } } };
  }
  try {
    const url = await optimizeAndUploadImage(file);
    return { ok: true, image: url };
  } catch (error) {
    console.error("Upload da imagem da proposta falhou:", error);
    return { ok: false, state: { error: "Não foi possível enviar a imagem. Tente novamente." } };
  }
}

/** Estado devolvido ao formulário (via useActionState) em caso de validação. */
export type ProposalFormState = {
  /** Mensagem geral de erro (topo do formulário). */
  error?: string;
  /** Erros por campo (chave = name do input). */
  fieldErrors?: Record<string, string>;
};

/** Campos de texto editáveis no painel — TODOS OPCIONAIS (vazio vira ""). */
const TEXT_FIELDS = ["title", "category", "description"] as const;

type ProposalData = {
  title: string;
  slug: string;
  category: string;
  featured: boolean;
  description: string;
  problem: string;
  objective: string;
  solution: string;
  goals: string;
  benefits: string;
  image: string | null;
  imagePlacement: string;
  faq: string | null;
  content: string | null;
};

/** Lê um campo do FormData: string, com CRLF normalizado e trim. */
function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  if (typeof value !== "string") return "";
  return value.replace(/\r\n/g, "\n").trim();
}

/**
 * Normaliza o FormData. Todos os campos são OPCIONAIS; a única garantia é um
 * slug válido (para a URL): usa o informado, senão deriva do título, senão gera
 * um fallback único. Não toca no banco e nunca falha.
 */
function parseProposal(formData: FormData): ProposalData {
  const values: Record<string, string> = {};
  for (const name of TEXT_FIELDS) values[name] = field(formData, name);

  const image = field(formData, "image");
  const content = field(formData, "content");
  // Onde a imagem aparece: só aceita os dois valores conhecidos.
  const imagePlacement =
    field(formData, "imagePlacement") === "external" ? "external" : "popup";
  // Checkbox: presente no FormData apenas quando marcado.
  const featured = formData.get("featured") != null;

  const slug =
    slugify(field(formData, "slug")) ||
    slugify(values.title) ||
    `proposta-${randomUUID().slice(0, 8)}`;

  return {
    title: values.title,
    slug,
    category: values.category,
    featured,
    description: values.description,
    // Campos estruturados legados: continuam NOT NULL no banco, mas saíram do
    // painel (confundiam). Gravamos vazio — o conteúdo rico vai em `content`.
    problem: "",
    objective: "",
    solution: "",
    goals: "",
    benefits: "",
    image: image || null,
    imagePlacement,
    faq: null,
    content: content || null,
  };
}

/** Revalida as rotas que leem propostas (painel + site público). */
function revalidateProposals(slug?: string): void {
  revalidatePath("/admin/propostas");
  revalidatePath("/propostas");
  revalidatePath("/");
  if (slug) revalidatePath(`/propostas/${slug}`);
}

/** true se o erro é violação de unicidade (slug duplicado) do Prisma. */
function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

const slugTakenState = (kind: "outra" | "esta" = "esta"): ProposalFormState => ({
  error: "Este slug já está em uso.",
  fieldErrors: {
    slug:
      kind === "outra"
        ? "Já existe outra proposta com este slug. Escolha outro."
        : "Já existe uma proposta com este slug. Escolha outro.",
  },
});

// --------------------------------------------------------------------- CREATE
export async function createProposal(
  _prevState: ProposalFormState,
  formData: FormData,
): Promise<ProposalFormState> {
  // GUARD de sessão — defesa em profundidade (fora de try/catch: pode lançar).
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const base = parseProposal(formData);

  // Upload da imagem (se enviaram um arquivo) antes de gravar.
  const img = await resolveImage(formData, base.image);
  if (!img.ok) return img.state;
  const data = { ...base, image: img.image };

  try {
    // Pré-checagem amigável de unicidade antes de tentar gravar.
    // Dentro do try: se a leitura ao banco falhar, devolvemos mensagem
    // amigável em vez de estourar 500.
    const existing = await prisma.proposal.findUnique({
      where: { slug: data.slug },
    });
    if (existing) return slugTakenState("esta");

    await prisma.proposal.create({ data });
  } catch (error) {
    // Defesa contra corrida: dois creates com o mesmo slug quase juntos.
    if (isUniqueConstraintError(error)) return slugTakenState("esta");
    // Qualquer outro erro (banco fora, timeout, etc.): nunca re-lançar numa
    // action de formulário admin — vira 500. Loga e devolve mensagem amigável.
    console.error("createProposal falhou:", error);
    return { error: "Não foi possível salvar. Tente novamente." };
  }

  revalidateProposals(data.slug);
  // redirect() lança NEXT_REDIRECT — fora do try/catch acima.
  redirect("/admin/propostas");
}

// --------------------------------------------------------------------- UPDATE
export async function updateProposal(
  id: string,
  _prevState: ProposalFormState,
  formData: FormData,
): Promise<ProposalFormState> {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const base = parseProposal(formData);

  // Upload da imagem (se enviaram um arquivo) antes de gravar.
  const img = await resolveImage(formData, base.image);
  if (!img.ok) return img.state;
  const data = { ...base, image: img.image };

  // Imagem antiga: se for trocada por outra, apagamos do storage depois.
  let oldImage: string | null = null;

  try {
    // O slug pode colidir com OUTRA proposta (não com ela mesma).
    // Dentro do try: se a leitura ao banco falhar, devolvemos mensagem
    // amigável em vez de estourar 500.
    const clash = await prisma.proposal.findFirst({
      where: { slug: data.slug, NOT: { id } },
    });
    if (clash) return slugTakenState("outra");

    const current = await prisma.proposal.findUnique({
      where: { id },
      select: { image: true },
    });
    oldImage = current?.image ?? null;

    await prisma.proposal.update({ where: { id }, data });
  } catch (error) {
    if (isUniqueConstraintError(error)) return slugTakenState("outra");
    // Registro inexistente (P2025): a proposta sumiu no meio do caminho.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return { error: "Esta proposta não existe mais." };
    }
    // Qualquer outro erro (banco fora, timeout, etc.): nunca re-lançar numa
    // action de formulário admin — vira 500. Loga e devolve mensagem amigável.
    console.error("updateProposal falhou:", error);
    return { error: "Não foi possível salvar. Tente novamente." };
  }

  // Trocou a imagem por outra? apaga a antiga do bucket (best-effort, não lança).
  if (oldImage && oldImage !== data.image && isStorageUrl(oldImage)) {
    await deleteImage(oldImage);
  }

  revalidateProposals(data.slug);
  redirect("/admin/propostas");
}

// --------------------------------------------------------------------- DELETE
export async function deleteProposal(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const id = field(formData, "id");
  if (!id) return;

  try {
    await prisma.proposal.delete({ where: { id } });
  } catch (error) {
    // Já não existe (P2025): idempotente, ignora. Outro erro (banco fora,
    // timeout, etc.): nunca re-lançar (vira 500) — apenas loga e segue.
    if (
      !(
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      )
    ) {
      console.error("deleteProposal falhou:", error);
    }
  }

  revalidateProposals();
}
