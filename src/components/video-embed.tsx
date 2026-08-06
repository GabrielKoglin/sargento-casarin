// ============================================================================
// video-embed.tsx — embed responsivo 16:9 para a galeria pública.
// ============================================================================
// Server Component (sem estado): decide entre <iframe> (YouTube/embed) e
// <video controls> (arquivo de vídeo) a partir do `src`. O wrapper mantém a
// proporção 16:9 e o conteúdo o preenche por completo.
import type { CSSProperties } from "react";
import { SocialVideo, type SocialPlatform } from "@/components/social-embed";

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

// Redes cujo player REPRODUZ inline no site (via SocialEmbed). Só entram aqui
// URLs claramente embutíveis; shortlinks (fb.watch, vm.tiktok.com) e formatos
// estranhos caem no card de fallback (blockedPlatform). Retorna a plataforma ou
// null quando o `src` não é um post/vídeo reconhecível.
function embeddablePlatform(src: string): SocialPlatform | null {
  // Instagram: post/reel/tv com slug (ex.: /reel/DYiatxQPX-a/).
  if (/instagram\.com\/(?:reel|reels|p|tv)\/[\w-]+/i.test(src)) return "instagram";
  // TikTok: /video/<id> ou /v/<id> (shortlink vm.tiktok.com não casa → card).
  if (/tiktok\.com\/(?:.*\/)?(?:video|v)\/\d+/i.test(src)) return "tiktok";
  // Facebook: .../videos/<id> (fb.watch não casa → card).
  if (/facebook\.com\/[^/]+\/videos\/\d+/i.test(src)) return "facebook";
  return null;
}

// Redes que BLOQUEIAM iframe direto (X-Frame-Options: DENY) e cujo `src` NÃO é
// embutível pelo SocialEmbed (ex.: shortlink fb.watch, vm.tiktok.com, ou link de
// perfil). Para elas mostramos um card que abre o vídeo na origem. Retorna o
// rótulo/gradiente da plataforma (ou null — aí cai no iframe genérico, ex.: Vimeo).
function blockedPlatform(src: string): { name: string; grad: string } | null {
  if (/instagram\.com/i.test(src)) {
    return { name: "Instagram", grad: "linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)" };
  }
  if (/tiktok\.com/i.test(src)) {
    return { name: "TikTok", grad: "linear-gradient(135deg,#25f4ee,#111,#fe2c55)" };
  }
  if (/facebook\.com|fb\.watch/i.test(src)) {
    return { name: "Facebook", grad: "linear-gradient(135deg,#1877f2,#0a2e4f)" };
  }
  return null;
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
  const isFile = isVideoFile(src);
  const social = ytId || isFile ? null : embeddablePlatform(src);
  const blocked = ytId || isFile ? null : blockedPlatform(src);

  // Instagram (reel/post), TikTok (/video/) e Facebook (/videos/) reproduzem
  // DENTRO do site: card por padrão, player embutido ao clicar (SocialVideo).
  // Evita a "caixa branca" do embed no load e carrega o script de terceiro só
  // por ação do usuário. Vertical, sem wrapper 16:9.
  if (social) {
    return <SocialVideo platform={social} url={src} poster={poster} title={title} />;
  }

  // Redes sem player embutível (shortlink fb.watch, vm.tiktok.com, link de
  // perfil) → card clicável que abre o vídeo na origem (evita o "conexão
  // recusada"). Usa o poster, se houver.
  if (blocked) {
    return (
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Assistir ${label} no ${blocked.name} (abre em nova aba)`}
        style={{
          ...wrapperStyle,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.7rem",
          textDecoration: "none",
          color: "#fff",
          background: poster ? undefined : blocked.grad,
        }}
      >
        {poster ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={poster}
              alt=""
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            />
            <span style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.45)" }} aria-hidden="true" />
          </>
        ) : null}
        <span
          aria-hidden="true"
          style={{
            position: "relative",
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "rgba(255,255,255,.92)",
            color: "#111",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.4rem",
            paddingLeft: 4,
          }}
        >
          ▶
        </span>
        <span style={{ position: "relative", fontWeight: 700, fontSize: "0.92rem" }}>
          Assistir no {blocked.name}
        </span>
      </a>
    );
  }

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
        // URL de embed genérica (ex.: Vimeo) que permite iframe.
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
