// ============================================================================
// admin/(app)/agenda/page.tsx — lista de eventos (/admin/agenda)
// ============================================================================
// Server Component. Herda o shell + guarda de sessão de (app)/layout.tsx.
//
// PAGINAÇÃO: só os PAGE_SIZE eventos da página atual são carregados.
//   ?page = 1..N  (default: 1; sempre "clampado" ao intervalo válido)
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteEvent } from "./actions";
import { formatEventDate } from "./date-utils";

// Lista sempre "ao vivo" — nunca pré-renderizar em build.
export const dynamic = "force-dynamic";

const PAGE_SIZE = 40;

function parsePage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export default async function AdminAgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;

  // Contamos primeiro para "clampar" a página ao intervalo válido — assim um
  // ?page absurdo nunca vira um skip gigante contra o banco.
  const total = await prisma.event.count();
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, parsePage(sp.page)), totalPages);

  const eventos = await prisma.event.findMany({
    orderBy: { date: "asc" },
    take: PAGE_SIZE,
    skip: (page - 1) * PAGE_SIZE,
  });

  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  return (
    <>
      <header className="admin-page-header admin-page-header--row">
        <div>
          <span className="admin-page-header__eyebrow">Operações</span>
          <h1 className="admin-page-header__title">Agenda</h1>
          <p className="admin-page-header__subtitle">
            Eventos e mobilizações exibidos na página pública /agenda.
          </p>
        </div>
        <div className="admin-page-header__actions">
          <Link href="/admin/agenda/new" className="admin-btn">
            Novo evento
          </Link>
        </div>
      </header>

      {total === 0 ? (
        <p className="admin-note">
          <strong>Nenhum evento cadastrado.</strong> Clique em{" "}
          <strong>“Novo evento”</strong> para criar o primeiro item da agenda.
        </p>
      ) : (
        <div
          className="overflow-x-auto rounded border"
          style={{ borderColor: "var(--a-line)" }}
        >
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr
                className="text-xs uppercase tracking-wider"
                style={{ color: "var(--a-muted)" }}
              >
                <th className="font-semibold">Título</th>
                <th className="font-semibold">Data</th>
                <th className="font-semibold">Local</th>
                <th className="text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {eventos.map((evento) => (
                <tr key={evento.id} className="align-top">
                  <td className="font-semibold" style={{ color: "var(--a-text)" }}>
                    {evento.title}
                  </td>
                  <td className="whitespace-nowrap" style={{ color: "var(--a-muted)" }}>
                    {formatEventDate(evento.date)}
                  </td>
                  <td style={{ color: "var(--a-muted)" }}>{evento.location}</td>
                  <td className="admin-cell--actions">
                    <div className="admin-actions">
                      <Link
                        href={`/admin/agenda/${evento.id}/edit`}
                        className="admin-btn admin-btn--ghost admin-btn--sm"
                      >
                        Editar
                      </Link>
                      <form action={deleteEvent}>
                        <input type="hidden" name="id" value={evento.id} />
                        <button
                          type="submit"
                          className="admin-btn admin-btn--danger admin-btn--sm"
                        >
                          Excluir
                        </button>
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
            {total === 1 ? "evento" : "eventos"}
          </span>
          <div className="admin-pager__nav">
            <PagerLink
              href={prevPage ? `/admin/agenda?page=${prevPage}` : null}
              label="← Anterior"
            />
            <PagerLink
              href={nextPage ? `/admin/agenda?page=${nextPage}` : null}
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
