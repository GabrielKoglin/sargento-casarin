"use client";

// ============================================================================
// social-embed.tsx — players embutidos das redes (Instagram, TikTok, Facebook)
// ============================================================================
// Renderiza o vídeo DENTRO do site (não um card que abre na origem). Cada rede
// usa a técnica que foi validada empiricamente como funcional inline:
//   • Instagram → <blockquote class="instagram-media"> + embed.js (Embeds.process)
//   • TikTok    → <blockquote class="tiktok-embed"> + embed.js (re-injetado em SPA)
//   • Facebook  → <iframe> do plugin oficial video.php (sem script)
//
// SSR-safe: nada toca window/document no render — só dentro de useEffect. Reels e
// TikTok são VERTICAIS, então NÃO usamos wrapper 16:9; o container tem largura
// máxima e os próprios scripts auto-redimensionam a altura (via postMessage).

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

// window.instgrm é injetado pelo embed.js do Instagram — tipamos só o mínimo.
declare global {
  interface Window {
    instgrm?: { Embeds?: { process?: () => void } };
  }
}

export type SocialPlatform = "instagram" | "tiktok" | "facebook";

export type SocialEmbedProps = {
  platform: SocialPlatform;
  url: string;
  title?: string | null;
};

const IG_SCRIPT = "https://www.instagram.com/embed.js";
const TIKTOK_SCRIPT = "https://www.tiktok.com/embed.js";

// Container comum: centraliza o player e limita a largura (bom no mobile também).
// Sem aspect-ratio — Reels/TikTok são verticais e os scripts ajustam a altura.
const containerStyle: CSSProperties = {
  maxWidth: 540,
  width: "100%",
  margin: "0 auto",
};

// ---------------------------------------------------------------------------
// loadScript — injeta um <script async> UMA vez por src, com cache de Promise.
// Chamadas repetidas para o mesmo src reaproveitam a mesma Promise (não duplica
// a tag nem a carga). Só deve ser chamado no cliente (dentro de useEffect).
// ---------------------------------------------------------------------------
const scriptCache = new Map<string, Promise<void>>();

function loadScript(src: string): Promise<void> {
  const cached = scriptCache.get(src);
  if (cached) return cached;

  const promise = new Promise<void>((resolve, reject) => {
    const el = document.createElement("script");
    el.src = src;
    el.async = true;
    el.addEventListener("load", () => resolve(), { once: true });
    el.addEventListener(
      "error",
      () => reject(new Error(`Falha ao carregar script: ${src}`)),
      { once: true },
    );
    document.body.appendChild(el);
  });

  scriptCache.set(src, promise);
  return promise;
}

// Normaliza a URL do Instagram: remove query (?igsh=...) e hash, garante a barra
// final. O embed.js exige o permalink canônico para casar o post.
function normalizeInstagramUrl(url: string): string {
  let clean = url.split("?")[0].split("#")[0].trim();
  if (!clean.endsWith("/")) clean += "/";
  return clean;
}

// Extrai o id numérico do TikTok de /video/<id> ou /v/<id>. Shortlinks
// (vm.tiktok.com/...) não têm id → null (o pai mostra o card de fallback).
function extractTikTokId(url: string): string | null {
  const match = /\/video\/(\d+)/.exec(url) ?? /\/v\/(\d+)/.exec(url);
  return match ? match[1] : null;
}

// ---------------------------------------------------------------------------
// Instagram
// ---------------------------------------------------------------------------
function InstagramEmbed({ url }: { url: string; title?: string | null }) {
  const permalink = normalizeInstagramUrl(url);

  useEffect(() => {
    let cancelled = false;
    loadScript(IG_SCRIPT)
      .then(() => {
        // O script já pode estar carregado (cache): re-processa para transformar
        // este blockquote no player. process() varre todos os .instagram-media.
        if (!cancelled) window.instgrm?.Embeds?.process?.();
      })
      .catch((err) => console.error("Instagram embed:", err));
    return () => {
      cancelled = true;
    };
  }, [permalink]);

  return (
    <div style={containerStyle}>
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={permalink}
        data-instgrm-version="14"
        style={{ maxWidth: 540, minWidth: 300, width: "100%", margin: "0 auto" }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// TikTok
// ---------------------------------------------------------------------------
function TikTokEmbed({ url }: { url: string; title?: string | null }) {
  const videoId = extractTikTokId(url);

  useEffect(() => {
    if (!videoId) return;
    // O embed.js do TikTok só processa os blockquotes no load — não há API de
    // reprocesso. Em SPA (navegação sem reload) removemos a tag anterior desse
    // src e re-injetamos para forçar o processamento deste novo blockquote.
    document
      .querySelectorAll(`script[src="${TIKTOK_SCRIPT}"]`)
      .forEach((s) => s.remove());
    scriptCache.delete(TIKTOK_SCRIPT);

    const el = document.createElement("script");
    el.src = TIKTOK_SCRIPT;
    el.async = true;
    document.body.appendChild(el);

    return () => {
      el.remove();
    };
  }, [url, videoId]);

  // Sem id (shortlink vm.tiktok.com) → o pai renderiza o card; aqui é defensivo.
  if (!videoId) return null;

  return (
    <div style={containerStyle}>
      <blockquote
        className="tiktok-embed"
        cite={url}
        data-video-id={videoId}
        style={{ maxWidth: 540, minWidth: 300, width: "100%", margin: "0 auto" }}
      >
        <section />
      </blockquote>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Facebook — plugin oficial via iframe, sem script. Só para .../videos/<id>;
// fb.watch (shortlink) não é embutível aqui → null (o pai mostra o card).
// ---------------------------------------------------------------------------
function FacebookEmbed({ url, title }: { url: string; title?: string | null }) {
  if (!/facebook\.com\/[^/]+\/videos\/\d+/i.test(url)) return null;

  const src = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
    url,
  )}&show_text=false`;

  return (
    <div style={containerStyle}>
      <iframe
        src={src}
        width="100%"
        height={315}
        style={{ border: "none", overflow: "hidden" }}
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        allowFullScreen
        title={title ?? "Vídeo do Facebook"}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dispatcher público. Cada plataforma é um componente próprio (hooks sempre
// chamados na ordem certa, sem condicional dentro de um único componente).
// ---------------------------------------------------------------------------
export function SocialEmbed({ platform, url, title }: SocialEmbedProps) {
  if (platform === "instagram") return <InstagramEmbed url={url} title={title} />;
  if (platform === "tiktok") return <TikTokEmbed url={url} title={title} />;
  if (platform === "facebook") return <FacebookEmbed url={url} title={title} />;
  return null;
}

// ---------------------------------------------------------------------------
// SocialVideo — FACADE "clique para reproduzir".
// ---------------------------------------------------------------------------
// Por padrão mostra um card bonito (poster ou gradiente da rede + play). Só ao
// CLICAR é que o embed de terceiro carrega inline (SocialEmbed). Vantagens:
//   • nunca mostra a "caixa branca" do embed enquanto carrega/se falhar;
//   • cumpre "reproduzir no site" — o player abre embutido, sem sair da página;
//   • privacidade/LGPD: scripts e cookies de terceiros só entram por ação do
//     usuário (não no carregamento da página).
const PLATFORM_META: Record<SocialPlatform, { name: string; grad: string }> = {
  instagram: { name: "Instagram", grad: "linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)" },
  tiktok: { name: "TikTok", grad: "linear-gradient(135deg,#25f4ee,#111,#fe2c55)" },
  facebook: { name: "Facebook", grad: "linear-gradient(135deg,#1877f2,#0a2e4f)" },
};

export type SocialVideoProps = SocialEmbedProps & { poster?: string | null };

export function SocialVideo({ platform, url, title, poster }: SocialVideoProps) {
  const [play, setPlay] = useState(false);
  const meta = PLATFORM_META[platform];

  if (play) {
    // Player embutido + rede de segurança: o embed do Instagram (sobretudo) às
    // vezes não popula (localhost, rate-limit, post restrito). O link garante
    // que o usuário SEMPRE alcance o vídeo, mesmo se o iframe vier vazio.
    return (
      <div style={{ maxWidth: 540, margin: "0 auto" }}>
        <SocialEmbed platform={platform} url={url} title={title} />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            textAlign: "center",
            marginTop: "0.5rem",
            fontSize: "0.8rem",
            fontWeight: 600,
            color: "rgba(255,255,255,.7)",
          }}
        >
          Abrir no {meta.name} ↗
        </a>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlay(true)}
      aria-label={`Reproduzir ${title ?? "vídeo"} do ${meta.name} aqui`}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16 / 9",
        borderRadius: "8px",
        overflow: "hidden",
        border: "none",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.7rem",
        color: "#fff",
        padding: 0,
        background: poster ? "#000" : meta.grad,
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
        Reproduzir aqui
      </span>
      <span style={{ position: "relative", fontSize: "0.72rem", opacity: 0.85, letterSpacing: ".04em" }}>
        {meta.name}
      </span>
    </button>
  );
}
