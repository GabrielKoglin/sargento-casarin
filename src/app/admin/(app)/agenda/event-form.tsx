"use client";

// ============================================================================
// agenda/event-form.tsx — formulário de evento (client, reutilizado por
// "novo" e "editar"). A action (createEvent/updateEvent) chega por prop; o id
// (no modo edição) viaja num campo oculto.
// ============================================================================
// Form totalmente CONTROLADO (useState): preserva o que o usuário digitou mesmo
// quando a action retorna erro de validação e re-renderiza sem redirecionar — o
// React 19 reseta os campos não-controlados de um <form action> após a action.
// Espelha o padrão de proposal-form.tsx / news-form.tsx.
//
// Estilo: reutiliza as classes de admin.css (.admin-field, .admin-btn, etc.).
// Onde admin.css não cobre (espaçamento do form, textarea multi-linha, botão
// secundário) usamos Tailwind e/ou style inline — inline vence o cascade porque
// admin.css é "unlayered" e ganha das utilities do Tailwind v4 (que ficam em
// @layer). NÃO editamos admin.css.
import Link from "next/link";
import { useActionState, useState } from "react";
import type { EventFormState } from "./actions";

const INITIAL_STATE: EventFormState = { error: null };

export type EventDefaults = {
  id: string;
  title: string;
  /** valor pronto para o input datetime-local: "YYYY-MM-DDTHH:mm". */
  date: string;
  location: string;
  description: string;
};

/** Valores dos campos (tudo string, prontos para os <input>). */
type EventFormValues = {
  title: string;
  date: string;
  location: string;
  description: string;
};

export function EventForm({
  action,
  submitLabel,
  defaults,
}: {
  action: (
    prev: EventFormState,
    formData: FormData,
  ) => Promise<EventFormState>;
  submitLabel: string;
  defaults?: EventDefaults;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const [values, setValues] = useState<EventFormValues>({
    title: defaults?.title ?? "",
    date: defaults?.date ?? "",
    location: defaults?.location ?? "",
    description: defaults?.description ?? "",
  });

  const setField = (field: keyof EventFormValues, value: string) =>
    setValues((prev) => ({ ...prev, [field]: value }));

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-5" noValidate>
      {defaults ? <input type="hidden" name="id" value={defaults.id} /> : null}

      <div className="admin-field">
        <label htmlFor="title" className="admin-field__label">
          Título
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          value={values.title}
          onChange={(e) => setField("title", e.target.value)}
          className="admin-field__input"
          placeholder="Ex.: Reunião com a comunidade"
        />
      </div>

      <div className="admin-field">
        <label htmlFor="date" className="admin-field__label">
          Data e hora
        </label>
        <input
          id="date"
          name="date"
          type="datetime-local"
          required
          value={values.date}
          onChange={(e) => setField("date", e.target.value)}
          className="admin-field__input"
        />
      </div>

      <div className="admin-field">
        <label htmlFor="location" className="admin-field__label">
          Local
        </label>
        <input
          id="location"
          name="location"
          type="text"
          required
          value={values.location}
          onChange={(e) => setField("location", e.target.value)}
          className="admin-field__input"
          placeholder="Ex.: Praça Central, Cuiabá"
        />
      </div>

      <div className="admin-field">
        <label htmlFor="description" className="admin-field__label">
          Descrição
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          value={values.description}
          onChange={(e) => setField("description", e.target.value)}
          className="admin-field__input"
          style={{
            height: "auto",
            minHeight: "7rem",
            padding: "0.6rem 0.85rem",
            lineHeight: 1.5,
            resize: "vertical",
          }}
          placeholder="Detalhes do evento…"
        />
      </div>

      {state.error ? (
        <p role="alert" className="admin-login__error">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="admin-btn" disabled={pending}>
          {pending ? "Salvando…" : submitLabel}
        </button>
        <Link
          href="/admin/agenda"
          className="admin-btn"
          style={{
            background: "transparent",
            color: "var(--a-muted)",
            border: "1px solid var(--a-line)",
          }}
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
