// ============================================================================
// admin/(app)/propostas/new/page.tsx — CRIAR proposta (/admin/propostas/new)
// ============================================================================
// Herda o shell + guarda de sessão de (app)/layout.tsx. Renderiza o mesmo
// ProposalForm usado na edição, ligado à Server Action createProposal.
import Link from "next/link";
import { createProposal } from "../actions";
import { ProposalForm } from "../proposal-form";

export default function NewProposalPage() {
  return (
    <>
      <header className="admin-page-header">
        <span className="admin-page-header__eyebrow">
          <Link href="/admin/propostas" className="hover:underline">
            Propostas
          </Link>{" "}
          / Nova
        </span>
        <h1 className="admin-page-header__title">Nova proposta</h1>
        <p className="admin-page-header__subtitle">
          Preencha os campos do eixo de atuação. O slug é gerado a partir do
          título.
        </p>
      </header>

      <ProposalForm action={createProposal} submitLabel="Criar proposta" />
    </>
  );
}
