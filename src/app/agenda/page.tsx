import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Agenda",
  description: "Agenda de eventos e mobilizações da pré-campanha do Sargento Dickson Casarin.",
};

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "America/Cuiaba",
});

export default async function AgendaPage() {
  const eventos = await prisma.event.findMany({
    where: { date: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    orderBy: { date: "asc" },
  });

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
            <div className="priv-body">
              <p>
                Nenhum evento agendado no momento. Entre para a{" "}
                <Link href="/tropa" style={{ color: "var(--B)" }}>
                  Tropa
                </Link>{" "}
                e seja avisado das próximas mobilizações.
              </p>
            </div>
          ) : (
            <div className="grupos-list" style={{ maxWidth: "720px" }}>
              {eventos.map((evento) => (
                <div className="grupo-card fi" key={evento.id}>
                  <div className="grupo-ico" style={{ background: "var(--B)", fontSize: "1.2rem" }}>
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
