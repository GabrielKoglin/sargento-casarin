import type { MetadataRoute } from "next";

// ============================================================================
// manifest.ts — Web App Manifest (PWA) do PAINEL administrativo
// ============================================================================
// Gera /manifest.webmanifest (Next injeta o <link rel="manifest"> em todas as
// páginas). O `scope`/`start_url` em /admin fazem o app instalado abrir direto
// no painel e o navegador só oferecer "Instalar" dentro do /admin — o site
// público não vira um "app do painel". A metadata da Apple (iOS) fica em
// src/app/admin/layout.tsx (escopada só ao /admin).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/admin",
    name: "Painel Sargento Casarin",
    short_name: "Painel Casarin",
    description:
      "Painel administrativo da campanha do Sargento Dickson Casarin.",
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    orientation: "portrait",
    background_color: "#020b14",
    theme_color: "#020b14",
    lang: "pt-BR",
    dir: "ltr",
    categories: ["productivity", "business"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
