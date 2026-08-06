"use client";

// ============================================================================
// midia/media-form.tsx — formulário de ADICIONAR mídia (foto/vídeo). Client
// Component: useActionState para exibir o erro vindo da Server Action
// createMedia. O <input type="file"> exige encType="multipart/form-data".
// ============================================================================
import { useActionState, useState } from "react";
import { createMedia, type MediaFormState } from "./actions";

const INITIAL_STATE: MediaFormState = { error: null };

const hintStyle: React.CSSProperties = {
  fontSize: "0.72rem",
  color: "var(--a-muted)",
  lineHeight: 1.4,
};

export function MediaForm() {
  const [state, formAction, pending] = useActionState(createMedia, INITIAL_STATE);
  const [type, setType] = useState<"photo" | "video">("photo");

  return (
    <form
      action={formAction}
      encType="multipart/form-data"
      noValidate
      className="admin-card"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.15rem",
        maxWidth: "640px",
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
        <label htmlFor="media-type" className="admin-field__label">
          Tipo
        </label>
        <select
          id="media-type"
          name="type"
          className="admin-field__input"
          value={type}
          onChange={(e) => setType(e.target.value as "photo" | "video")}
        >
          <option value="photo">Foto</option>
          <option value="video">Vídeo</option>
        </select>
      </div>

      <div className="admin-field">
        <label htmlFor="media-title" className="admin-field__label">
          Título — opcional
        </label>
        <input
          id="media-title"
          name="title"
          type="text"
          className="admin-field__input"
          placeholder={
            type === "photo" ? "Legenda da foto" : "Título do vídeo"
          }
        />
      </div>

      {type === "photo" ? (
        <>
          <div className="admin-field">
            <label htmlFor="media-file" className="admin-field__label">
              Arquivo de imagem
            </label>
            <input
              id="media-file"
              name="file"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="admin-field__input"
              style={{ height: "auto", padding: "0.55rem 0.6rem" }}
            />
            <span style={hintStyle}>
              JPG, PNG, WebP ou AVIF — até 12&nbsp;MB. A imagem é otimizada
              automaticamente (girada pelo EXIF, reduzida e convertida em WebP).
            </span>
          </div>
          <div className="admin-field">
            <label htmlFor="media-src-photo" className="admin-field__label">
              …ou URL da imagem
            </label>
            <input
              id="media-src-photo"
              name="src"
              type="url"
              className="admin-field__input"
              placeholder="https://…/foto.jpg"
            />
            <span style={hintStyle}>
              Use o arquivo <strong>ou</strong> uma URL externa. Se enviar as
              duas, o arquivo tem preferência.
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="admin-field">
            <label htmlFor="media-src-video" className="admin-field__label">
              URL do vídeo
            </label>
            <input
              id="media-src-video"
              name="src"
              type="url"
              required
              className="admin-field__input"
              placeholder="https://www.youtube.com/watch?v=…"
            />
            <span style={hintStyle}>
              Links do YouTube (watch, youtu.be ou shorts) são convertidos para
              embed automaticamente.
            </span>
          </div>
          <div className="admin-field">
            <label htmlFor="media-poster" className="admin-field__label">
              Miniatura (poster) — opcional
            </label>
            <input
              id="media-poster"
              name="poster"
              type="url"
              className="admin-field__input"
              placeholder="https://…/thumb.jpg"
            />
          </div>
        </>
      )}

      <div style={{ marginTop: "0.35rem" }}>
        <button type="submit" className="admin-btn" disabled={pending}>
          {pending ? "Enviando…" : "Adicionar mídia"}
        </button>
      </div>
    </form>
  );
}
