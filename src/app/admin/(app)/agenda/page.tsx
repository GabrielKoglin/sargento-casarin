// ============================================================================
// admin/(app)/agenda/page.tsx — lista de eventos (/admin/agenda)
// ============================================================================
// Server Component. Herda o shell + guarda de sessão de (app)/layout.tsx.
//
// PAGINAÇÃO: só os PAGE_SIZE eventos da página atual são carregados.
//   ?page = 1..N  (default: 1; sempre "clampado" ao intervalo válido)
import Link from "next/link";
import type { CSSProperties } from "react";
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
      <header className="admin-page-header flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="admin-page-header__eyebrow">Operações</span>
          <h1 className="admin-page-header__title">Agenda</h1>
          <p className="admin-page-header__subtitle">
            Eventos e mobilizações exibidos na página pública /agenda.
          </p>
        </div>
        <Link href="/admin/agenda/new" className="admin-btn">
          Novo evento
        </Link>
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
                <th className="px-4 py-3 font-semibold">Título</th>
                <th className="px-4 py-3 font-semibold">Data</th>
                <th className="px-4 py-3 font-semibold">Local</th>
                <th className="px-4 py-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {eventos.map((evento) => (
                <tr
                  key={evento.id}
                  className="border-t align-top"
                  style={{ borderColor: "var(--a-line)" }}
                >
                  <td className="px-4 py-3 font-semibold" style={{ color: "var(--a-text)" }}>
                    {evento.title}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3" style={{ color: "var(--a-muted)" }}>
                    {formatEventDate(evento.date)}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--a-muted)" }}>
                    {evento.location}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/admin/agenda/${evento.id}/edit`}
                        className="font-semibold uppercase tracking-wider"
                        style={{ color: "var(--a-green-bright)" }}
                      >
                        Editar
                      </Link>
                      <form action={deleteEvent}>
                        <input type="hidden" name="id" value={evento.id} />
                        <button
                          type="submit"
                          className="cursor-pointer bg-transparent font-semibold uppercase tracking-wider"
                          style={{ color: "var(--a-danger)" }}
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            marginTop: "1.25rem",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "var(--a-muted)" }}>
            Página {page} de {totalPages} · {total}{" "}
            {total === 1 ? "evento" : "eventos"}
          </span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
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
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "0.4rem 0.85rem",
    borderRadius: "3px",
    border: "1px solid var(--a-line)",
    fontSize: "0.8rem",
    fontWeight: 600,
  };
  if (!href) {
    return (
      <span
        aria-disabled="true"
        style={{ ...base, color: "var(--a-muted)", opacity: 0.4 }}
      >
        {label}
      </span>
    );
  }
  return (
    <Link href={href} style={{ ...base, color: "var(--a-text)" }}>
      {label}
    </Link>
  );
}
