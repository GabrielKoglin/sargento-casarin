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
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Prisma } from "@/generated/prisma/client";
import { slugify } from "./slug";

/** Estado devolvido ao formulário (via useActionState) em caso de validação. */
export type ProposalFormState = {
  /** Mensagem geral de erro (topo do formulário). */
  error?: string;
  /** Erros por campo (chave = name do input). */
  fieldErrors?: Record<string, string>;
};

/** Campos obrigatórios (todos String no schema; image/faq são opcionais). */
const REQUIRED_FIELDS = [
  "title",
  "category",
  "description",
  "problem",
  "objective",
  "solution",
  "goals",
  "benefits",
] as const;

type ProposalData = {
  title: string;
  slug: string;
  category: string;
  description: string;
  problem: string;
  objective: string;
  solution: string;
  goals: string;
  benefits: string;
  image: string | null;
  faq: string | null;
};

type ParseResult =
  | { ok: true; data: ProposalData }
  | { ok: false; state: ProposalFormState };

/** Lê um campo do FormData: string, com CRLF normalizado e trim. */
function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  if (typeof value !== "string") return "";
  return value.replace(/\r\n/g, "\n").trim();
}

/** Valida e normaliza o FormData. Não toca no banco. */
function parseProposal(formData: FormData): ParseResult {
  const fieldErrors: Record<string, string> = {};

  const values: Record<string, string> = {};
  for (const name of REQUIRED_FIELDS) {
    values[name] = field(formData, name);
    if (!values[name]) fieldErrors[name] = "Campo obrigatório.";
  }

  const image = field(formData, "image");
  const faq = field(formData, "faq");

  // Slug: usa o informado (normalizado) ou deriva do título.
  const slug = slugify(field(formData, "slug")) || slugify(values.title);
  if (!slug) {
    fieldErrors.slug =
      "Não foi possível gerar um slug. Ajuste o título ou preencha o slug.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      state: { error: "Corrija os campos destacados abaixo.", fieldErrors },
    };
  }

  return {
    ok: true,
    data: {
      title: values.title,
      slug,
      category: values.category,
      description: values.description,
      problem: values.problem,
      objective: values.objective,
      solution: values.solution,
      goals: values.goals,
      benefits: values.benefits,
      image: image || null,
      faq: faq || null,
    },
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

  const parsed = parseProposal(formData);
  if (!parsed.ok) return parsed.state;
  const { data } = parsed;

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

  const parsed = parseProposal(formData);
  if (!parsed.ok) return parsed.state;
  const { data } = parsed;

  try {
    // O slug pode colidir com OUTRA proposta (não com ela mesma).
    // Dentro do try: se a leitura ao banco falhar, devolvemos mensagem
    // amigável em vez de estourar 500.
    const clash = await prisma.proposal.findFirst({
      where: { slug: data.slug, NOT: { id } },
    });
    if (clash) return slugTakenState("outra");

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
