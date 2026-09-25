"use client";

// ============================================================================
// noticias/news-form.tsx — formulário reutilizável (criar/editar) + botão de
// excluir. Client Component: usa useActionState para exibir erros vindos das
// Server Actions (createNews / updateNews).
// ============================================================================
// Duas naturezas de notícia convivem neste form:
//   • MATÉRIA DE AUTORIA (nossa): preencha "Texto completo" — ela ganha uma
//     página no site (/noticias/[slug]); o "Link externo" fica vazio.
//   • Manchete manual apontando para outro portal: deixe o texto completo vazio
//     e preencha o "Link da matéria original".
import { useActionState, useState, type ChangeEvent } from "react";
import Link from "next/link";
import type { NewsFormState } from "./actions";
import { ConfirmSubmit } from "../confirm-submit";

/** Valores dos campos do formulário (tudo string, prontos para <input>). */
export type NewsFormValues = {
  title: string;
  slug: string;
  source: string;
  author: string;
  summary: string;
  content: string;
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
  author: "",
  summary: "",
  content: "",
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

// A Vercel corta requisições acima de ~4,5 MB — foto de celular estoura isso e o
// upload falha ANTES de chegar no servidor. Solução: reduzir a imagem NO
// NAVEGADOR (canvas → JPEG) antes de enviar. (mesma técnica de proposal-form.)
const RESIZE_THRESHOLD_BYTES = 3_500_000;

function resizeImageInBrowser(
  file: File,
  maxDim = 2200,
  quality = 0.82,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
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
  const [filePreview, setFilePreview] = useState<string>("");
  const [resizing, setResizing] = useState(false);

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

  // Ao escolher um arquivo: reduz no navegador (se grande), substitui o arquivo
  // do input pela versão menor e mostra a pré-visualização.
  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      setFilePreview("");
      return;
    }
    let finalFile = file;
    if (file.size > RESIZE_THRESHOLD_BYTES) {
      setResizing(true);
      try {
        const blob = await resizeImageInBrowser(file);
        if (blob && blob.size < file.size) {
          const base = file.name.replace(/\.[^.]+$/, "") || "imagem";
          finalFile = new File([blob], `${base}.jpg`, { type: "image/jpeg" });
          const dt = new DataTransfer();
          dt.items.add(finalFile);
          input.files = dt.files;
        }
      } finally {
        setResizing(false);
      }
    }
    setFilePreview(URL.createObjectURL(finalFile));
  }

  return (
    <form
      action={formAction}
      encType="multipart/form-data"
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
          Fonte / selo do card
        </label>
        <input
          id="source"
          name="source"
          type="text"
          required
          className="admin-field__input"
          value={values.source}
          onChange={(e) => setField("source", e.target.value)}
          placeholder="Ex.: Sargento Casarin (matéria própria) ou G1, Só Notícias…"
        />
        <span style={hintStyle}>
          Aparece como o selo no card. Para matéria de autoria própria, use o nome
          da campanha (ex.: “Sargento Casarin”).
        </span>
      </div>

      <div className="admin-field">
        <label htmlFor="author" className="admin-field__label">
          Autoria (assinatura) — opcional
        </label>
        <input
          id="author"
          name="author"
          type="text"
          className="admin-field__input"
          value={values.author}
          onChange={(e) => setField("author", e.target.value)}
          placeholder="Ex.: Maria Silva"
        />
        <span style={hintStyle}>
          Nome de quem assina a matéria. Aparece como “Por {values.author || "…"}”
          na página da notícia (só nas matérias com texto completo).
        </span>
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
          placeholder="Breve resumo exibido no card da notícia (e como abertura da matéria)."
        />
      </div>

      <div className="admin-field">
        <label htmlFor="content" className="admin-field__label">
          Texto completo da matéria — opcional
        </label>
        <textarea
          id="content"
          name="content"
          rows={14}
          className="admin-field__input"
          style={{
            height: "auto",
            minHeight: "16rem",
            padding: "0.65rem 0.85rem",
            lineHeight: 1.6,
            resize: "vertical",
          }}
          value={values.content}
          onChange={(e) => setField("content", e.target.value)}
          placeholder={
            "Cole aqui o texto da matéria (do Word).\n\nDeixe uma LINHA EM BRANCO entre os parágrafos.\n\n## Um subtítulo\nTexto do parágrafo, com **negrito** onde quiser.\n\n- item de lista\n- outro item"
          }
        />
        <span style={hintStyle}>
          <strong>Preencha para publicar uma matéria NOSSA</strong> — ela ganha uma
          página no site em vez de abrir um link externo. Formatação: deixe uma
          linha em branco entre parágrafos; use <code>## Título</code>,{" "}
          <code>### Subtítulo</code>, <code>- item</code> e{" "}
          <code>**negrito**</code>. Deixe vazio se for só uma manchete que aponta
          para outro portal.
        </span>
      </div>

      <div className="admin-field">
        <label htmlFor="imageFile" className="admin-field__label">
          Foto da matéria (upload) — opcional
        </label>
        {(filePreview || values.image) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={filePreview || values.image}
            alt="Pré-visualização da imagem da notícia"
            style={{
              maxWidth: "260px",
              width: "100%",
              height: "auto",
              borderRadius: "6px",
              border: "1px solid var(--a-line)",
              marginBottom: "0.6rem",
              display: "block",
            }}
          />
        )}
        <input
          id="imageFile"
          name="imageFile"
          type="file"
          accept="image/*"
          className="admin-field__input"
          onChange={handleFileChange}
        />
        <span style={hintStyle}>
          Envie uma foto (JPG/PNG) — é otimizada automaticamente. Ou cole uma URL
          abaixo. Se enviar um arquivo, ele tem prioridade sobre a URL.
        </span>
        {resizing && (
          <span style={hintStyle}>Otimizando imagem…</span>
        )}
      </div>

      <div className="admin-field">
        <label htmlFor="image" className="admin-field__label">
          … ou cole a URL de uma imagem
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
          Link da matéria original — só para notícias de outros portais (opcional)
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
        <span style={hintStyle}>
          Deixe vazio nas matérias de autoria própria (as que têm texto completo
          acima).
        </span>
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
