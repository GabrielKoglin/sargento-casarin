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
import { clearSessionCookie } from "@/lib/session";
import { canAccessArea, getCurrentAdmin, type AreaKey } from "@/lib/permissions";
import { type AdminNavItem } from "./admin-nav";
import { AdminSidebar } from "./admin-sidebar";

// Cada item de menu de conteúdo mapeia para a área de permissão que o libera.
// Itens fora deste mapa: Dashboard/Segurança (qualquer sessão) e os OWNER_ONLY.
const AREA_OF: Record<string, AreaKey> = {
  "/admin/propostas": "propostas",
  "/admin/noticias": "noticias",
  "/admin/agenda": "agenda",
  "/admin/conteudo": "conteudo",
  "/admin/mensagens": "mensagens",
  "/admin/adesivos": "adesivos",
  "/admin/apoiadores": "apoiadores",
};
const OWNER_ONLY = new Set(["/admin/equipe", "/admin/config"]);
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
  // Resolve o usuário logado (sessão → banco), já com papel e permissões — a
  // sessão (JWT) só guarda id+e-mail. getCurrentAdmin() também fecha o buraco da
  // SESSÃO ÓRFÃ: o JWT vale 7 dias, mas o usuário pode ter sido deletado/recriado
  // nesse intervalo; sem existir no banco, volta null e barramos abaixo. Em erro
  // de I/O também vira null (fail-closed) — numa área sensível, preferimos negar.
  //
  // (A checagem vive AQUI, runtime NODE, e não em @/lib/session, que é EDGE-SAFE
  // porque o Proxy o importa e prisma não pode entrar lá. Este layout é o único
  // ponto Node que guarda TODAS as páginas do painel.)
  const user = await getCurrentAdmin();

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

  // Menu por PERMISSÃO: o editor vê só as áreas concedidas; Equipe/Config só o
  // titular; Dashboard/Segurança todos. (Defesa em profundidade: cada página e
  // action reconfere via requireArea/requireOwner — esconder o link não basta.)
  const visibleItems = navItems.filter((item) => {
    if (OWNER_ONLY.has(item.href)) return user.role === "owner";
    const area = AREA_OF[item.href];
    return area ? canAccessArea(user, area) : true;
  });

  return (
    <div className="admin-scope admin-shell">
      <AdminSidebar items={visibleItems} email={user.email} />

      <section className="admin-main">
        <div className="admin-main__inner">{children}</div>
      </section>
    </div>
  );
}
