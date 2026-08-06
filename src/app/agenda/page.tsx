import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Event } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Agenda",
  description: "Agenda de eventos e mobilizações da campanha do Sargento Dickson Casarin.",
};

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "America/Cuiaba",
});

// Uma falha de I/O não pode derrubar a página: cai numa lista vazia, que mostra
// o empty-state "nenhuma operação agendada" em vez de estourar 500.
async function loadEventos(): Promise<Event[]> {
  // Rota force-dynamic: filtra eventos pelo relógio do request. Fora do componente
  // (numa função async comum), então não precisa mais do disable de react-hooks/purity.
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  try {
    return await prisma.event.findMany({
      where: { date: { gte: cutoff } },
      orderBy: { date: "asc" },
    });
  } catch (error) {
    console.error("Falha ao carregar eventos da agenda.", error);
    return [];
  }
}

export default async function AgendaPage() {
  const eventos = await loadEventos();

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow sl">Operações</div>
          <h1 className="sl d1">
            AGENDA DE <em>CAMPO</em>
          </h1>
          <p className="fi d2">
            Onde encontrar o Sargento Casarin: eventos, encontros e mobilizações pelo estado.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {eventos.length === 0 ? (
            <div className="priv-body" style={{ margin: "0 auto", maxWidth: "620px", textAlign: "center" }}>
              <div className="eyebrow" style={{ justifyContent: "center" }}>Situação atual</div>
              <h2 style={{ marginTop: "1rem" }}>NENHUMA OPERAÇÃO AGENDADA</h2>
              <p style={{ margin: "1rem auto 1.5rem" }}>
                Entre nos nossos grupos e seja avisado das próximas mobilizações.
              </p>
              <Link href="/tropa" className="btn btn-gold">
                Nossos Grupos <span aria-hidden="true">➔</span>
              </Link>
            </div>
          ) : (
            <div className="grupos-list" style={{ maxWidth: "720px" }}>
              {eventos.map((evento) => (
                <div className="grupo-card fi" key={evento.id}>
                  <div className="grupo-ico" aria-hidden="true" style={{ background: "var(--B)", fontSize: "1.2rem" }}>
                    📅
                  </div>
                  <div className="grupo-txt">
                    <strong>{evento.title}</strong>
                    <span>
                      {dateFormat.format(evento.date)} · {evento.location}
                    </span>
                    <span>{evento.description}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
