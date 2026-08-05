// ============================================================================
// admin/(app)/propostas/page.tsx — LISTA de propostas (/admin/propostas)
// ============================================================================
// Herda o shell + guarda de sessão de (app)/layout.tsx. force-dynamic porque a
// lista precisa refletir o banco ao vivo (nunca pré-renderizar em build).
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteProposal } from "./actions";
import { DeleteButton } from "./delete-button";

export const dynamic = "force-dynamic";

export default async function PropostasAdminPage() {
  const propostas = await prisma.proposal.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <header className="admin-page-header" style={{ marginBottom: 0 }}>
          <span className="admin-page-header__eyebrow">Conteúdo</span>
          <h1 className="admin-page-header__title">Propostas</h1>
          <p className="admin-page-header__subtitle">
            Gerencie os eixos de atuação exibidos no site.
          </p>
        </header>

        <Link href="/admin/propostas/new" className="admin-btn">
          + Nova proposta
        </Link>
      </div>

      {propostas.length === 0 ? (
        <div className="admin-note">
          Nenhuma proposta cadastrada ainda.{" "}
          <Link
            href="/admin/propostas/new"
            className="font-semibold text-[var(--a-green-bright)] underline underline-offset-2"
          >
            Crie a primeira proposta
          </Link>{" "}
          para ela aparecer no site.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[4px] border border-[var(--a-line)] bg-[var(--a-panel)]">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--a-line)]">
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--a-muted)]">
                  Título
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--a-muted)]">
                  Categoria
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--a-muted)]">
                  Slug
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-[var(--a-muted)]">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {propostas.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-[var(--a-line)] last:border-0 hover:bg-[var(--a-panel-2)]"
                >
                  <td className="px-4 py-3 font-semibold text-[var(--a-text)]">
                    {p.title}
                  </td>
                  <td className="px-4 py-3 text-[var(--a-muted)]">
                    {p.category}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--a-muted)]">
                    {p.slug}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/propostas/${p.id}/edit`}
                        className="inline-flex items-center rounded-[3px] border border-[var(--a-line)] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[var(--a-green-bright)] transition-colors hover:border-[var(--a-green)] hover:bg-[rgba(0,184,75,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,184,75,0.4)]"
                      >
                        Editar
                      </Link>
                      <form action={deleteProposal}>
                        <input type="hidden" name="id" value={p.id} />
                        <DeleteButton label={p.title} />
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
