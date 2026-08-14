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
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { clearSessionCookie, getSession } from "@/lib/session";
import { type AdminNavItem } from "./admin-nav";
import { AdminSidebar } from "./admin-sidebar";
import "../admin.css";

// `icon` é uma CHAVE mapeada para um ícone (react-icons) em admin-sidebar.tsx.
const NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/propostas", label: "Propostas", icon: "propostas" },
  { href: "/admin/noticias", label: "Notícias", icon: "noticias" },
  { href: "/admin/agenda", label: "Agenda", icon: "agenda" },
  { href: "/admin/conteudo", label: "Conteúdo", icon: "conteudo" },
  { href: "/admin/mensagens", label: "Mensagens", icon: "mensagens" },
  { href: "/admin/adesivos", label: "Adesivos", icon: "adesivos" },
  { href: "/admin/apoiadores", label: "Apoiadores", icon: "apoiadores" },
  { href: "/admin/equipe", label: "Equipe", icon: "equipe" },
  { href: "/admin/seguranca", label: "Segurança", icon: "seguranca" },
  { href: "/admin/config", label: "Config", icon: "config" },
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
  let user: { id: string; email: string } | null = null;
  try {
    user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { id: true, email: true },
    });
  } catch {
    user = null;
  }

  // Notificação: total de mensagens de contato NÃO lidas → badge na aba
  // "Mensagens". Falha de I/O vira 0 (o painel abre mesmo assim).
  let unread = 0;
  try {
    unread = await prisma.contact.count({ where: { read: false } });
  } catch {
    unread = 0;
  }
  // Badge da aba "Adesivos": pedidos ainda não entregues.
  let pendingStickers = 0;
  try {
    pendingStickers = await prisma.stickerRequest.count({ where: { delivered: false } });
  } catch {
    pendingStickers = 0;
  }
  // Badge da aba "Apoiadores": cadastros de líder aguardando aprovação.
  let pendingLeaders = 0;
  try {
    pendingLeaders = await prisma.leader.count({ where: { status: "pending" } });
  } catch {
    pendingLeaders = 0;
  }
  const navItems: AdminNavItem[] = NAV_ITEMS.map((item) => {
    if (item.href === "/admin/mensagens") return { ...item, badge: unread };
    if (item.href === "/admin/adesivos") return { ...item, badge: pendingStickers };
    if (item.href === "/admin/apoiadores") return { ...item, badge: pendingLeaders };
    return item;
  });

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
      <AdminSidebar items={navItems} email={user.email} />

      <section className="admin-main">
        <div className="admin-main__inner">{children}</div>
      </section>
    </div>
  );
}
