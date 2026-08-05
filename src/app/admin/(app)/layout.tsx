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
import { prisma } from "@/lib/prisma";
import { clearSessionCookie, getSession } from "@/lib/session";
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

  // Sessão órfã: o JWT vale 7 dias, mas o usuário pode ter sido DELETADO ou
  // recriado nesse intervalo. getSession() só valida a ASSINATURA do token —
  // não consulta o banco — então um cookie de um usuário que não existe mais
  // continuaria dando acesso admin. Aqui (Server Component = runtime NODE)
  // confirmamos que o `sub` do token ainda corresponde a um usuário existente.
  //
  // Por que a checagem vive AQUI e não em @/lib/session: session.ts é EDGE-SAFE
  // (só jose + next/headers) porque o Proxy o importa; prisma não pode entrar
  // lá. O layout é o único ponto Node que guarda TODAS as páginas do painel.
  //
  // Trade-off: as Server Actions do CRUD seguem usando só getSession() (+ Proxy)
  // — não repetem esta consulta ao banco. Mas nenhuma PÁGINA protegida renderiza
  // sem passar por este shell, então a checagem forte de existência já fecha o
  // acesso via UI. Em erro de I/O do banco tratamos como não autenticado
  // (fail-closed): numa área sensível, preferimos negar a exibir o painel.
  let user: { id: string } | null = null;
  try {
    user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { id: true },
    });
  } catch {
    user = null;
  }

  if (!user) {
    // Cookie órfão: tenta limpá-lo. Em Server Component (fase de render) os
    // cookies são READ-ONLY e `delete` lança (E1180) — por isso o try/catch.
    // Quem efetivamente barra o acesso é o redirect abaixo; a remoção definitiva
    // do cookie ocorre no próximo logout/login (contexto de Server Action).
    try {
      await clearSessionCookie();
    } catch {
      // cookies imutáveis nesta fase — ignore; o redirect protege a rota.
    }
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
