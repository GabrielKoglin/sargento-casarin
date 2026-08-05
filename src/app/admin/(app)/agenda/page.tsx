// ============================================================================
// admin/(app)/agenda/page.tsx — lista de eventos (/admin/agenda)
// ============================================================================
// Server Component. Herda o shell + guarda de sessão de (app)/layout.tsx.
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteEvent } from "./actions";
import { formatEventDate } from "./date-utils";

// Lista sempre "ao vivo" — nunca pré-renderizar em build.
export const dynamic = "force-dynamic";

export default async function AdminAgendaPage() {
  const eventos = await prisma.event.findMany({ orderBy: { date: "asc" } });

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

      {eventos.length === 0 ? (
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
    </>
  );
}
