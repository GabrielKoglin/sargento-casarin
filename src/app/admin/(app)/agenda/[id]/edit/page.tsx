// ============================================================================
// admin/(app)/agenda/[id]/edit/page.tsx — editar evento
// ============================================================================
// Herda o shell + guarda de sessão de (app)/layout.tsx. Carrega o evento por id
// (notFound se não existir) e reusa o EventForm com a action updateEvent.
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EventForm } from "../../event-form";
import { updateEvent } from "../../actions";
import { toDatetimeLocalValue } from "../../date-utils";

export const dynamic = "force-dynamic";

export default async function EditEventPage(
  props: PageProps<"/admin/agenda/[id]/edit">,
) {
  const { id } = await props.params;
  const evento = await prisma.event.findUnique({ where: { id } });
  if (!evento) notFound();

  return (
    <>
      <header className="admin-page-header">
        <span className="admin-page-header__eyebrow">Agenda</span>
        <h1 className="admin-page-header__title">Editar evento</h1>
        <p className="admin-page-header__subtitle">
          Atualize os dados do evento e salve as alterações.
        </p>
      </header>

      <EventForm
        action={updateEvent}
        submitLabel="Salvar alterações"
        defaults={{
          id: evento.id,
          title: evento.title,
          date: toDatetimeLocalValue(evento.date),
          location: evento.location,
          description: evento.description,
        }}
      />
    </>
  );
}
