// ============================================================================
// admin/(app)/propostas/[id]/edit/page.tsx — EDITAR proposta
// ============================================================================
// Carrega a proposta por id (notFound() se não existir) e renderiza o MESMO
// ProposalForm preenchido. A action updateProposal recebe o id via .bind() —
// assim ele não vai para o HTML como campo oculto.
//
// Tipamos params manualmente (Promise<{ id: string }>) em vez de usar o helper
// global PageProps<...>: rota nova, o tipo de rota gerado pode ainda não existir
// quando o tsc roda, e a assinatura manual é compatível com o esperado.
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateProposal } from "../../actions";
import { ProposalForm } from "../../proposal-form";

export const dynamic = "force-dynamic";

export default async function EditProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const proposta = await prisma.proposal.findUnique({ where: { id } });
  if (!proposta) notFound();

  // Prende o id como primeiro argumento da action (fora do FormData/HTML).
  const action = updateProposal.bind(null, proposta.id);

  return (
    <>
      <header className="admin-page-header">
        <span className="admin-page-header__eyebrow">
          <Link href="/admin/propostas" className="hover:underline">
            Propostas
          </Link>{" "}
          / Editar
        </span>
        <h1 className="admin-page-header__title">Editar proposta</h1>
        <p className="admin-page-header__subtitle">{proposta.title}</p>
      </header>

      <ProposalForm
        action={action}
        submitLabel="Salvar alterações"
        defaultValues={{
          title: proposta.title,
          slug: proposta.slug,
          category: proposta.category,
          description: proposta.description,
          problem: proposta.problem,
          objective: proposta.objective,
          solution: proposta.solution,
          goals: proposta.goals,
          benefits: proposta.benefits,
          image: proposta.image ?? "",
          faq: proposta.faq ?? "",
        }}
      />
    </>
  );
}
