// ============================================================================
// video-embed.tsx — embed responsivo 16:9 para a galeria pública.
// ============================================================================
// Server Component (sem estado): decide entre <iframe> (YouTube/embed) e
// <video controls> (arquivo de vídeo) a partir do `src`. O wrapper mantém a
// proporção 16:9 e o conteúdo o preenche por completo.
import type { CSSProperties } from "react";

export type VideoItem = {
  src: string;
  poster?: string | null;
  title?: string | null;
};

// Extrai o ID do YouTube de watch?v=, youtu.be/, /embed/ ou /shorts/.
function youTubeId(src: string): string | null {
  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(src);
    if (match) return match[1];
  }
  return null;
}

// Parece um arquivo de vídeo direto (mp4/webm/ogg/mov)?
function isVideoFile(src: string): boolean {
  return /\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i.test(src);
}

const wrapperStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  aspectRatio: "16 / 9",
  borderRadius: "8px",
  overflow: "hidden",
  background: "#000",
};

const fillStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  border: 0,
  display: "block",
};

export function VideoEmbed({ src, poster, title }: VideoItem) {
  const label = title ?? "Vídeo do Sargento Dickson Casarin";
  const ytId = youTubeId(src);

  return (
    <div style={wrapperStyle}>
      {ytId ? (
        <iframe
          src={`https://www.youtube.com/embed/${ytId}`}
          title={label}
          style={fillStyle}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : isVideoFile(src) ? (
        <video
          src={src}
          poster={poster ?? undefined}
          controls
          preload="metadata"
          style={{ ...fillStyle, objectFit: "cover" }}
        >
          <track kind="captions" />
        </video>
      ) : (
        // URL de embed genérica (ex.: Vimeo) que não é YouTube nem arquivo.
        <iframe
          src={src}
          title={label}
          style={fillStyle}
          loading="lazy"
          allowFullScreen
        />
      )}
    </div>
  );
}
