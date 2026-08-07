"use client";

// ============================================================================
// midia/media-form.tsx — formulário de ADICIONAR mídia (foto/vídeo). Client
// Component: useActionState para exibir o erro vindo da Server Action
// createMedia. O <input type="file"> exige encType="multipart/form-data".
// ============================================================================
import { useActionState, useState } from "react";
import { createMedia, type MediaFormState } from "./actions";

const INITIAL_STATE: MediaFormState = { error: null };

// A Vercel corta requisições acima de ~4,5 MB — foto de celular estoura isso e o
// upload falha ANTES de chegar na otimização do servidor. Solução: reduzir a
// imagem NO NAVEGADOR (canvas → JPEG) antes de enviar. Acima de ~3,5 MB, encolhe
// para no máx. `maxDim` px. Best-effort: se algo falhar, mantém o arquivo original.
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

export function MediaForm() {
  const [state, formAction, pending] = useActionState(createMedia, INITIAL_STATE);
  const [type, setType] = useState<"photo" | "video">("photo");
  const [resizing, setResizing] = useState(false);

  // Ao escolher um arquivo grande, reduz no navegador e substitui o arquivo do
  // input pela versão menor (via DataTransfer), garantindo o envio sob o limite.
  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file || !file.type.startsWith("image/") || file.size <= RESIZE_THRESHOLD_BYTES) {
      return;
    }
    setResizing(true);
    try {
      const blob = await resizeImageInBrowser(file);
      if (blob && blob.size < file.size) {
        const base = file.name.replace(/\.[^.]+$/, "") || "foto";
        const dt = new DataTransfer();
        dt.items.add(new File([blob], `${base}.jpg`, { type: "image/jpeg" }));
        input.files = dt.files;
      }
    } finally {
      setResizing(false);
    }
  }

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
              onChange={handleFileChange}
            />
            <span style={hintStyle}>
              JPG, PNG, WebP ou AVIF. Fotos grandes (de celular) são reduzidas
              automaticamente no navegador antes do envio, e depois otimizadas no
              servidor (giradas pelo EXIF e convertidas em WebP).
              {resizing ? (
                <strong style={{ color: "var(--a-green-bright)" }}>
                  {" "}Reduzindo a imagem…
                </strong>
              ) : null}
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
        <button type="submit" className="admin-btn" disabled={pending || resizing}>
          {resizing ? "Reduzindo imagem…" : pending ? "Enviando…" : "Adicionar mídia"}
        </button>
      </div>
    </form>
  );
}
