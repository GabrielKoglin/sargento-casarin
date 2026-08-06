// ============================================================================
// midia/page.tsx — guia MÍDIA do painel (/admin/midia)
// ============================================================================
// Herda o shell + guarda de sessão de (app)/layout.tsx. Gerencia as mídias da
// galeria pública: fotos (upload local otimizado ou URL) e vídeos (embed).
// Server Component: lê prisma.media e delega a interatividade a media-form.tsx
// (adicionar) e media-list.tsx (reordenar/publicar/excluir).
//
// ESTILO: reusa as classes do admin.css (admin-page-header, admin-btn,
// admin-card, admin-note, admin-field…). A GRADE de miniaturas usa estilos
// inline (React.CSSProperties) — não posso criar classes novas no admin.css.
import type { CSSProperties } from "react";
import { prisma } from "@/lib/prisma";
import { MediaForm } from "./media-form";
import { MediaItemActions } from "./media-list";

// Lista sempre "ao vivo" — nunca pré-renderizar em build.
export const dynamic = "force-dynamic";

type MediaItem = {
  id: string;
  type: string;
  title: string | null;
  src: string;
  poster: string | null;
  published: boolean;
};

// Lê fotos e vídeos já ordenados. Uma falha de I/O vira listas vazias (a guia
// abre com o formulário e um aviso, em vez de estourar 500).
async function loadMedia(): Promise<{ photos: MediaItem[]; videos: MediaItem[] }> {
  try {
    const [photos, videos] = await Promise.all([
      prisma.media.findMany({
        where: { type: "photo" },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      }),
      prisma.media.findMany({
        where: { type: "video" },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      }),
    ]);
    return { photos, videos };
  } catch (error) {
    console.error("Falha ao carregar mídias.", error);
    return { photos: [], videos: [] };
  }
}

const thumbBox: CSSProperties = {
  position: "relative",
  width: "100%",
  aspectRatio: "4 / 3",
  borderRadius: "6px",
  overflow: "hidden",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid var(--a-line)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const thumbImg: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

function StatusPill({ published }: { published: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.12rem 0.5rem",
        borderRadius: "999px",
        border: `1px solid ${
          published ? "rgba(0,184,75,0.4)" : "rgba(245,197,24,0.4)"
        }`,
        background: published ? "rgba(0,184,75,0.12)" : "rgba(245,197,24,0.12)",
        color: published ? "var(--a-green-bright)" : "#f5c518",
        fontSize: "0.65rem",
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {published ? "Publicada" : "Oculta"}
    </span>
  );
}

function MediaCard({ item }: { item: MediaItem }) {
  const isVideo = item.type === "video";
  // Foto: miniatura do próprio src. Vídeo: poster se houver; senão um bloco ▶.
  const thumbSrc = isVideo ? item.poster : item.src;

  return (
    <div
      className="admin-card"
      style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}
    >
      <div style={thumbBox}>
        {thumbSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbSrc}
            alt={item.title ?? (isVideo ? "Vídeo" : "Foto")}
            style={thumbImg}
            loading="lazy"
          />
        ) : (
          <span
            aria-hidden="true"
            style={{ fontSize: "2rem", color: "var(--a-muted)", opacity: 0.7 }}
          >
            ▶
          </span>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
        }}
      >
        <span
          style={{
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "var(--a-text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={item.title ?? undefined}
        >
          {item.title ?? (isVideo ? "Vídeo sem título" : "Foto sem título")}
        </span>
        <StatusPill published={item.published} />
      </div>

      {isVideo && (
        <a
          href={item.src}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: "0.72rem",
            color: "var(--a-muted)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.src}
        </a>
      )}

      <MediaItemActions
        id={item.id}
        published={item.published}
        title={item.title}
      />
    </div>
  );
}

function MediaGrid({ items }: { items: MediaItem[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "1rem",
      }}
    >
      {items.map((item) => (
        <MediaCard key={item.id} item={item} />
      ))}
    </div>
  );
}

export default async function AdminMidiaPage() {
  const { photos, videos } = await loadMedia();

  return (
    <>
      <header className="admin-page-header">
        <span className="admin-page-header__eyebrow">Conteúdo</span>
        <h1 className="admin-page-header__title">Mídia</h1>
        <p className="admin-page-header__subtitle">
          Fotos e vídeos da <strong>galeria</strong> pública. Envie um arquivo
          (otimizado automaticamente) ou cole uma URL; ocultar tira do ar sem
          apagar.
        </p>
      </header>

      <section style={{ marginBottom: "2.25rem" }}>
        <h2
          style={{
            margin: "0 0 0.9rem",
            fontSize: "0.95rem",
            fontWeight: 700,
            color: "var(--a-text)",
          }}
        >
          Adicionar mídia
        </h2>
        <MediaForm />
      </section>

      <section style={{ marginBottom: "2.25rem" }}>
        <h2
          style={{
            margin: "0 0 0.9rem",
            fontSize: "0.95rem",
            fontWeight: 700,
            color: "var(--a-text)",
          }}
        >
          Fotos <span style={{ color: "var(--a-muted)" }}>({photos.length})</span>
        </h2>
        {photos.length === 0 ? (
          <div className="admin-note">
            Nenhuma foto ainda. A galeria pública usa fotos padrão até você
            adicionar as primeiras aqui.
          </div>
        ) : (
          <MediaGrid items={photos} />
        )}
      </section>

      <section>
        <h2
          style={{
            margin: "0 0 0.9rem",
            fontSize: "0.95rem",
            fontWeight: 700,
            color: "var(--a-text)",
          }}
        >
          Vídeos{" "}
          <span style={{ color: "var(--a-muted)" }}>({videos.length})</span>
        </h2>
        {videos.length === 0 ? (
          <div className="admin-note">
            Nenhum vídeo ainda. Cole uma URL do YouTube para exibir na galeria.
          </div>
        ) : (
          <MediaGrid items={videos} />
        )}
      </section>
    </>
  );
}
