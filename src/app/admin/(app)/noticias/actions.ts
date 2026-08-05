"use server";

// ============================================================================
// noticias/actions.ts — Server Actions do CRUD de notícias (Fase 2)
// ============================================================================
// RUNTIME: Node (Server Action). Cada action revalida a sessão por conta
// própria com getSession() — o Proxy (src/proxy.ts) não cobre os POSTs de
// action fora do matcher, então a guarda AQUI é a fronteira de segurança real
// (defesa em profundidade, além do layout do route group (app)).
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { ingestNews } from "@/lib/news-ingest";

/** Estado do formulário — erros de validação consumidos por useActionState. */
export type NewsFormState = { error: string | null };

// Slug: minúsculas, sem acentos, só [a-z0-9-]. A MESMA função existe no client
// (news-form.tsx) para o preview ao vivo; não dá para compartilhar de um módulo
// "use server" (cujos exports precisam ser async). O slug gravado é sempre o
// gerado AQUI — o servidor é a autoridade final. (̀-ͯ = marcas de
// acento combinantes que o NFD separa das letras.)
function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// input type="date" ("YYYY-MM-DD" ou "") -> DateTime. Vazio = agora; valor
// inválido também cai em "agora" (nunca deixamos um parse ruim virar 500).
function parsePublishedAt(raw: string): Date {
  const trimmed = raw.trim();
  if (!trimmed) return new Date();
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

// P2002 = violação de unique constraint (slug duplicado). Detectamos pelo
// `code` sem depender de importar a classe de erro do client gerado.
function isUniqueSlugError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

type ParsedNews = {
  title: string;
  slug: string;
  source: string;
  summary: string;
  image: string | null;
  url: string | null;
  publishedAt: Date;
};

// Lê + valida os campos do FormData. Retorna `{ error }` (mensagem clara) ou
// `{ data }` já pronto para o Prisma.
function parseNewsForm(
  formData: FormData,
): { error: string } | { data: ParsedNews } {
  const title = String(formData.get("title") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const source = String(formData.get("source") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const image = String(formData.get("image") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const publishedAtRaw = String(formData.get("publishedAt") ?? "");

  if (!title) return { error: "Informe o título da notícia." };
  if (!source) return { error: "Informe a fonte da notícia." };
  if (!summary) return { error: "Informe o resumo da notícia." };

  // Slug: usa o override manual se houver; senão deriva do título. Sempre
  // normalizado. Se ficar vazio (título só com símbolos), é erro claro.
  const slug = slugify(rawSlug || title);
  if (!slug) {
    return {
      error: "Não foi possível gerar um slug. Ajuste o título ou preencha o slug.",
    };
  }

  return {
    data: {
      title,
      slug,
      source,
      summary,
      image: image || null,
      url: url || null,
      publishedAt: parsePublishedAt(publishedAtRaw),
    },
  };
}

// Mensagem única para colisão de slug (usada na checagem prévia e no backstop).
function slugTakenMessage(slug: string): string {
  return `Já existe uma notícia com o slug "${slug}". Escolha outro.`;
}

export async function createNews(
  _prev: NewsFormState,
  formData: FormData,
): Promise<NewsFormState> {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const parsed = parseNewsForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  // Checagem prévia de unicidade (mensagem amigável no caminho comum); o catch
  // de P2002 abaixo é o backstop contra corrida entre a checagem e o insert.
  const existing = await prisma.news.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existing) return { error: slugTakenMessage(parsed.data.slug) };

  try {
    await prisma.news.create({ data: parsed.data });
  } catch (error) {
    if (isUniqueSlugError(error)) {
      return { error: slugTakenMessage(parsed.data.slug) };
    }
    console.error("Falha ao criar notícia.", error);
    return { error: "Não foi possível salvar a notícia. Tente novamente." };
  }

  // A página pública /noticias também lê News: revalida ambas.
  revalidatePath("/admin/noticias");
  revalidatePath("/noticias");
  // redirect() lança NEXT_REDIRECT — precisa ficar FORA de try/catch.
  redirect("/admin/noticias");
}

export async function updateNews(
  id: string,
  _prev: NewsFormState,
  formData: FormData,
): Promise<NewsFormState> {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const parsed = parseNewsForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  // Unicidade do slug, excluindo o próprio registro em edição.
  const existing = await prisma.news.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existing && existing.id !== id) {
    return { error: slugTakenMessage(parsed.data.slug) };
  }

  try {
    await prisma.news.update({ where: { id }, data: parsed.data });
  } catch (error) {
    if (isUniqueSlugError(error)) {
      return { error: slugTakenMessage(parsed.data.slug) };
    }
    console.error("Falha ao atualizar notícia.", error);
    return { error: "Não foi possível salvar a notícia. Tente novamente." };
  }

  revalidatePath("/admin/noticias");
  revalidatePath("/noticias");
  redirect("/admin/noticias");
}

// ============================================================================
// MODERAÇÃO DA FILA DE INGESTÃO
// ============================================================================
// As notícias ingeridas dos feeds nascem com status "pending". Estas ações
// movem cada item entre "pending" → "approved" (vai ao ar em /noticias) ou
// "rejected" (fica fora). O motor de ingestão (src/lib/news-ingest.ts) é
// reusado por `ingestNow` para o disparo manual pelo painel.

// Muda o status de UMA notícia (id via campo oculto do form). P2025 (registro
// inexistente/já alterado) é tratado sem 500. Fatora approve/reject.
async function setNewsStatus(
  formData: FormData,
  status: "approved" | "rejected",
): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  try {
    await prisma.news.update({ where: { id }, data: { status } });
  } catch (error) {
    // P2025 = "Record to update not found" (já removido/alterado): não é fatal.
    console.error(`Falha ao definir status "${status}" da notícia.`, error);
  }

  // Aprovar/rejeitar altera o que aparece em /noticias (só "approved").
  revalidatePath("/admin/noticias");
  revalidatePath("/noticias");
}

/** Aprova uma notícia pendente/rejeitada → visível na página pública. */
export async function approveNews(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  await setNewsStatus(formData, "approved");
}

/** Rejeita uma notícia → fica fora do site (não é excluída). */
export async function rejectNews(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  await setNewsStatus(formData, "rejected");
}

/**
 * Dispara a ingestão dos feeds AGORA (botão do painel). Reusa ingestNews(); as
 * manchetes novas entram como "pending" para moderação. Pode demorar alguns
 * segundos (busca ~25 feeds). O resumo é registrado no log do servidor; a fila
 * é revalidada e o usuário volta para a aba de pendentes.
 */
export async function ingestNow(): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  try {
    const summary = await ingestNews(prisma);
    console.log(
      `Ingestão manual concluída: ${summary.inserted} nova(s) de ${summary.fetched}/${summary.sources} fontes ` +
        `(${summary.skipped} ignoradas, ${summary.errors.length} erro(s)).`,
    );
    revalidatePath("/admin/noticias");
    revalidatePath("/noticias");
  } catch (error) {
    // Nunca deixamos a ingestão derrubar o painel: loga e segue para a fila.
    console.error("Falha na ingestão manual.", error);
  }

  // redirect() lança NEXT_REDIRECT — precisa ficar FORA de try/catch.
  redirect("/admin/noticias?status=pending");
}

// Invocada por um <form action={deleteNews.bind(null, id)}> na lista. A
// identidade vem do id vinculado no servidor, não do payload do client — por
// isso o FormData que o form action envia é ignorado (nem declarado).
export async function deleteNews(id: string): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  try {
    await prisma.news.delete({ where: { id } });
  } catch (error) {
    // Registro já removido / id inexistente não é fatal: seguimos e a lista
    // revalidada já reflete o estado atual (sem 500).
    console.error("Falha ao excluir notícia.", error);
  }

  // Sem redirect: revalidatePath re-renderiza a própria lista na mesma resposta.
  revalidatePath("/admin/noticias");
  revalidatePath("/noticias");
}
