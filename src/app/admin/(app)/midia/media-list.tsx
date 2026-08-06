"use client";

// ============================================================================
// midia/media-list.tsx — ações por item da lista de mídia (client). A lista em
// si é renderizada no Server Component (page.tsx); este componente entrega só a
// interatividade: reordenar, publicar/ocultar e excluir (com window.confirm).
// As Server Actions são vinculadas ao id no client via .bind (suportado).
// ============================================================================
import { deleteMedia, togglePublished, moveMedia } from "./actions";

const rowActionBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  padding: 0,
  fontFamily: "inherit",
  fontSize: "0.8rem",
  fontWeight: 600,
  cursor: "pointer",
};

const iconBtn: React.CSSProperties = {
  ...rowActionBtn,
  width: "1.6rem",
  height: "1.6rem",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "4px",
  border: "1px solid var(--a-line)",
  color: "var(--a-muted)",
};

export function MediaItemActions({
  id,
  published,
  title,
}: {
  id: string;
  published: boolean;
  title?: string | null;
}) {
  const alvo = title ? `"${title}"` : "esta mídia";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", gap: "0.3rem" }}>
        <form action={moveMedia.bind(null, id, "up")} style={{ margin: 0 }}>
          <button type="submit" style={iconBtn} title="Subir" aria-label="Subir">
            ↑
          </button>
        </form>
        <form action={moveMedia.bind(null, id, "down")} style={{ margin: 0 }}>
          <button
            type="submit"
            style={iconBtn}
            title="Descer"
            aria-label="Descer"
          >
            ↓
          </button>
        </form>
      </div>

      <form action={togglePublished.bind(null, id)} style={{ margin: 0 }}>
        <button
          type="submit"
          style={{
            ...rowActionBtn,
            color: published ? "#f5c518" : "var(--a-green-bright)",
          }}
        >
          {published ? "Ocultar" : "Publicar"}
        </button>
      </form>

      <form action={deleteMedia.bind(null, id)} style={{ margin: 0 }}>
        <button
          type="submit"
          onClick={(e) => {
            if (
              !window.confirm(
                `Excluir ${alvo}? Esta ação não pode ser desfeita.`,
              )
            ) {
              e.preventDefault();
            }
          }}
          style={{ ...rowActionBtn, color: "var(--a-danger)" }}
        >
          Excluir
        </button>
      </form>
    </div>
  );
}
