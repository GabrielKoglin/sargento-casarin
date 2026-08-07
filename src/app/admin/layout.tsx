// ============================================================================
// admin/layout.tsx — camada fina que ESCOPA a metadata de PWA ao /admin
// ============================================================================
// Envolve TODAS as rotas /admin (login + route group (app)). Não desenha nada
// (o login e o shell do (app) têm o próprio layout completo) — só existe para
// declarar a metadata da Apple e o theme-color SOMENTE no painel, sem sujar o
// site público. O manifest em si é global (src/app/manifest.ts), mas escopado
// via `scope: "/admin"`.
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  // iOS: "Adicionar à Tela de Início" abre em tela cheia (standalone), com este
  // título e a barra de status escura. O ícone vem de admin/apple-icon.png.
  appleWebApp: {
    capable: true,
    title: "Painel Casarin",
    statusBarStyle: "black",
  },
  // O apple-touch-icon é servido de /public/icons (fora do proxy de /admin, que
  // redireciona qualquer /admin/* sem sessão ao login — inclusive um ícone).
  icons: {
    apple: "/icons/apple-icon-180.png",
  },
  // O Next 16 emite a meta padrão `mobile-web-app-capable`; iOS antigo (< 16.4)
  // só entende a variante legada. Emitimos as duas para tela-cheia em todo iPhone.
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#020b14",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
