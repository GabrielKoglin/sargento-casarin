"use client";

// ============================================================================
// noticias/news-form.tsx — formulário reutilizável (criar/editar) + botão de
// excluir. Client Component: usa useActionState para exibir erros vindos das
// Server Actions (createNews / updateNews).
// ============================================================================
import { useActionState, useState } from "react";
import Link from "next/link";
import type { NewsFormState } from "./actions";
import { ConfirmSubmit } from "../confirm-submit";

/** Valores dos campos do formulário (tudo string, prontos para <input>). */
export type NewsFormValues = {
  title: string;
  slug: string;
  source: string;
  summary: string;
  image: string;
  url: string;
  /** "YYYY-MM-DD" para o <input type="date"> (ou "" = usar hoje). */
  publishedAt: string;
};

const INITIAL_STATE: NewsFormState = { error: null };

const EMPTY_VALUES: NewsFormValues = {
  title: "",
  slug: "",
  source: "",
  summary: "",
  image: "",
  url: "",
  publishedAt: "",
};

// Espelha slugify de actions.ts (feedback ao vivo). O servidor normaliza de
// novo no submit, então isto é só UX — nunca a fonte da verdade.
function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const hintStyle: React.CSSProperties = {
  fontSize: "0.72rem",
  color: "var(--a-muted)",
  lineHeight: 1.4,
};

export function NewsForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (prev: NewsFormState, formData: FormData) => Promise<NewsFormState>;
  defaultValues?: NewsFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  // Form totalmente controlado: preserva o que o usuário digitou mesmo quando a
  // action retorna erro (ex.: slug duplicado) e re-renderiza sem redirecionar.
  const [values, setValues] = useState<NewsFormValues>(
    defaultValues ?? EMPTY_VALUES,
  );
  // O slug acompanha o título até o usuário mexer nele (ou já vir preenchido,
  // no modo edição), quando passa a ser manual.
  const [slugLocked, setSlugLocked] = useState(Boolean(defaultValues?.slug));

  function handleTitle(value: string) {
    setValues((prev) => ({
      ...prev,
      title: value,
      slug: slugLocked ? prev.slug : slugify(value),
    }));
  }
  function handleSlug(value: string) {
    setSlugLocked(true);
    setValues((prev) => ({ ...prev, slug: value }));
  }
  function normalizeSlug() {
    setValues((prev) => ({ ...prev, slug: slugify(prev.slug) }));
  }
  function setField(field: keyof NewsFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <form
      action={formAction}
      noValidate
      style={{
        maxWidth: "640px",
        display: "flex",
        flexDirection: "column",
        gap: "1.15rem",
      }}
    >
      {state?.error ? (
        <p
          role="alert"
          style={{
            margin: 0,
            padding: "0.6rem 0.75rem",
            border: "1px solid rgba(255,90,90,0.4)",
            borderLeftWidth: "3px",
            borderRadius: "3px",
            background: "rgba(255,90,90,0.08)",
            color: "#ff9a9a",
            fontSize: "0.82rem",
            fontWeight: 500,
          }}
        >
          {state.error}
        </p>
      ) : null}

      <div className="admin-field">
        <label htmlFor="title" className="admin-field__label">
          Título
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          className="admin-field__input"
          value={values.title}
          onChange={(e) => handleTitle(e.target.value)}
          placeholder="Título da notícia"
        />
      </div>

      <div className="admin-field">
        <label htmlFor="slug" className="admin-field__label">
          Slug
        </label>
        <input
          id="slug"
          name="slug"
          type="text"
          className="admin-field__input"
          value={values.slug}
          onChange={(e) => handleSlug(e.target.value)}
          onBlur={normalizeSlug}
          placeholder="gerado-a-partir-do-titulo"
        />
        <span style={hintStyle}>
          Gerado automaticamente do título. Edite para personalizar — será
          normalizado (minúsculas, sem acentos, hífens) e precisa ser único.
        </span>
      </div>

      <div className="admin-field">
        <label htmlFor="source" className="admin-field__label">
          Fonte
        </label>
        <input
          id="source"
          name="source"
          type="text"
          required
          className="admin-field__input"
          value={values.source}
          onChange={(e) => setField("source", e.target.value)}
          placeholder="Ex.: G1, Diário da Região"
        />
      </div>

      <div className="admin-field">
        <label htmlFor="summary" className="admin-field__label">
          Resumo
        </label>
        <textarea
          id="summary"
          name="summary"
          required
          rows={4}
          className="admin-field__input"
          style={{
            height: "auto",
            minHeight: "7rem",
            padding: "0.65rem 0.85rem",
            lineHeight: 1.5,
            resize: "vertical",
          }}
          value={values.summary}
          onChange={(e) => setField("summary", e.target.value)}
          placeholder="Breve resumo exibido no card da notícia."
        />
      </div>

      <div className="admin-field">
        <label htmlFor="image" className="admin-field__label">
          Imagem (URL) — opcional
        </label>
        <input
          id="image"
          name="image"
          type="url"
          className="admin-field__input"
          value={values.image}
          onChange={(e) => setField("image", e.target.value)}
          placeholder="https://…/imagem.jpg"
        />
      </div>

      <div className="admin-field">
        <label htmlFor="url" className="admin-field__label">
          Link da matéria original — opcional
        </label>
        <input
          id="url"
          name="url"
          type="url"
          className="admin-field__input"
          value={values.url}
          onChange={(e) => setField("url", e.target.value)}
          placeholder="https://…"
        />
      </div>

      <div className="admin-field">
        <label htmlFor="publishedAt" className="admin-field__label">
          Data de publicação
        </label>
        <input
          id="publishedAt"
          name="publishedAt"
          type="date"
          className="admin-field__input"
          style={{ colorScheme: "dark" }}
          value={values.publishedAt}
          onChange={(e) => setField("publishedAt", e.target.value)}
        />
        <span style={hintStyle}>Deixe em branco para usar a data de hoje.</span>
      </div>

      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          marginTop: "0.35rem",
          flexWrap: "wrap",
        }}
      >
        <button type="submit" className="admin-btn" disabled={pending}>
          {pending ? "Salvando…" : submitLabel}
        </button>
        <Link
          href="/admin/noticias"
          className="admin-btn"
          style={{
            background: "transparent",
            border: "1px solid var(--a-line)",
            color: "var(--a-muted)",
          }}
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}

// Botão de excluir da lista: fica dentro de um <form action={deleteNews.bind}>
// (Server Component). É client só para confirmar antes de submeter.
export function DeleteButton({ label }: { label?: string }) {
  const alvo = label ? `"${label}"` : "esta notícia";
  return (
    <ConfirmSubmit
      className="admin-btn admin-btn--danger admin-btn--sm"
      title="Excluir notícia"
      message={`Excluir ${alvo}? Esta ação não pode ser desfeita.`}
      confirmLabel="Excluir"
      danger
    >
      Excluir
    </ConfirmSubmit>
  );
}
