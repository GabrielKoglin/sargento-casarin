// ============================================================================
// admin/(app)/agenda/new/page.tsx — criar evento (/admin/agenda/new)
// ============================================================================
// Herda o shell + guarda de sessão de (app)/layout.tsx. O formulário usa a
// action createEvent (que também revalida a sessão por conta própria).
import { EventForm } from "../event-form";
import { createEvent } from "../actions";

export default function NewEventPage() {
  return (
    <>
      <header className="admin-page-header">
        <span className="admin-page-header__eyebrow">Agenda</span>
        <h1 className="admin-page-header__title">Novo evento</h1>
        <p className="admin-page-header__subtitle">
          Cadastre um evento para exibir na página pública /agenda.
        </p>
      </header>

      <EventForm action={createEvent} submitLabel="Criar evento" />
    </>
  );
}
