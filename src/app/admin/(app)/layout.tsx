// ============================================================================
// admin/(app)/layout.tsx — SHELL PROTEGIDO do painel (Server Component)
// ============================================================================
// ⚠️  ONDE CRIAR AS PÁGINAS DO CRUD (Fase 2):
//     Toda página protegida (propostas, notícias, agenda, mensagens, config)
//     DEVE ser criada DENTRO de `src/app/admin/(app)/` — ex.:
//       src/app/admin/(app)/propostas/page.tsx  ->  rota /admin/propostas
//     Assim ela herda ESTE layout (sidebar + botão Sair) E a guarda de sessão
//     abaixo. O route group `(app)` não aparece na URL; serve só para manter a
//     página de login (`src/app/admin/login/`) FORA deste shell.
//
// Defesa em profundidade: o Proxy (src/proxy.ts) já barra /admin sem sessão,
// mas revalidamos aqui com getSession() — cada Server Action do CRUD também
// deve checar a sessão por conta própria (o Proxy não cobre chamadas de ação
// em rotas fora do matcher).
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { logout } from "../actions";
import "../admin.css";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/propostas", label: "Propostas" },
  { href: "/admin/noticias", label: "Notícias" },
  { href: "/admin/agenda", label: "Agenda" },
  { href: "/admin/mensagens", label: "Mensagens" },
  { href: "/admin/config", label: "Config" },
];

export default async function AdminAppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="admin-scope admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <span className="admin-sidebar__brand-eyebrow">Painel</span>
          <div className="admin-sidebar__brand-title">Casarin</div>
        </div>

        <nav className="admin-nav" aria-label="Navegação do painel">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="admin-nav__link">
              {item.label}
            </Link>
          ))}
        </nav>

        <form action={logout}>
          <button type="submit" className="admin-logout">
            Sair
          </button>
        </form>
      </aside>

      <section className="admin-main">{children}</section>
    </div>
  );
}
