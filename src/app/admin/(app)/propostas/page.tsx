// ============================================================================
// admin/(app)/propostas/page.tsx — LISTA de propostas (/admin/propostas)
// ============================================================================
// Herda o shell + guarda de sessão de (app)/layout.tsx. force-dynamic porque a
// lista precisa refletir o banco ao vivo (nunca pré-renderizar em build).
//
// PAGINAÇÃO: só as PAGE_SIZE propostas da página atual são carregadas.
//   ?page = 1..N  (default: 1; sempre "clampado" ao intervalo válido)
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteProposal } from "./actions";
import { DeleteButton } from "./delete-button";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 40;

function parsePage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export default async function PropostasAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;

  // Contamos primeiro para "clampar" a página ao intervalo válido — assim um
  // ?page absurdo nunca vira um skip gigante contra o banco.
  const total = await prisma.proposal.count();
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, parsePage(sp.page)), totalPages);

  const propostas = await prisma.proposal.findMany({
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE,
    skip: (page - 1) * PAGE_SIZE,
  });

  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  return (
    <>
      <header className="admin-page-header admin-page-header--row">
        <div>
          <span className="admin-page-header__eyebrow">Conteúdo</span>
          <h1 className="admin-page-header__title">Propostas</h1>
          <p className="admin-page-header__subtitle">
            Gerencie os eixos de atuação exibidos no site.
          </p>
        </div>

        <div className="admin-page-header__actions">
          <Link href="/admin/propostas/new" className="admin-btn">
            + Nova proposta
          </Link>
        </div>
      </header>

      {total === 0 ? (
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
              <tr>
                <th className="text-xs font-bold uppercase tracking-wider text-[var(--a-muted)]">
                  Título
                </th>
                <th className="text-xs font-bold uppercase tracking-wider text-[var(--a-muted)]">
                  Categoria
                </th>
                <th className="text-xs font-bold uppercase tracking-wider text-[var(--a-muted)]">
                  Slug
                </th>
                <th className="text-right text-xs font-bold uppercase tracking-wider text-[var(--a-muted)]">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {propostas.map((p) => (
                <tr key={p.id} className="hover:bg-[var(--a-panel-2)]">
                  <td className="font-semibold text-[var(--a-text)]">
                    <span className="inline-flex items-center gap-2">
                      {p.title}
                      {p.featured ? (
                        <span className="prop-badge prop-badge--main">
                          Principal
                        </span>
                      ) : (
                        <span className="prop-badge prop-badge--tema">Tema</span>
                      )}
                    </span>
                  </td>
                  <td className="text-[var(--a-muted)]">{p.category}</td>
                  <td>
                    <code className="admin-chip">{p.slug}</code>
                  </td>
                  <td className="admin-cell--actions">
                    <div className="admin-actions">
                      <Link
                        href={`/admin/propostas/${p.id}/edit`}
                        className="admin-btn admin-btn--ghost admin-btn--sm"
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

      {/* ------------------------------------------------------ paginação */}
      {total > 0 && (
        <div className="admin-pager">
          <span className="admin-pager__info">
            Página {page} de {totalPages} · {total}{" "}
            {total === 1 ? "proposta" : "propostas"}
          </span>
          <div className="admin-pager__nav">
            <PagerLink
              href={prevPage ? `/admin/propostas?page=${prevPage}` : null}
              label="← Anterior"
            />
            <PagerLink
              href={nextPage ? `/admin/propostas?page=${nextPage}` : null}
              label="Próxima →"
            />
          </div>
        </div>
      )}
    </>
  );
}

// Link de paginação; quando `href` é null vira um botão "apagado" (sem navegar).
function PagerLink({ href, label }: { href: string | null; label: string }) {
  if (!href) {
    return (
      <span aria-disabled="true" className="admin-pager__btn">
        {label}
      </span>
    );
  }
  return (
    <Link href={href} className="admin-pager__btn">
      {label}
    </Link>
  );
}
