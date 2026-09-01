// ============================================================================
// admin/(app)/page.tsx — Dashboard (/admin)
// ============================================================================
// Herda o shell + guarda de sessão de `(app)/layout.tsx`.
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { areaLabel, canAccessArea, getCurrentAdmin, type AreaKey } from "@/lib/permissions";

// Contadores são sempre "ao vivo" — nunca pré-renderizar em build.
export const dynamic = "force-dynamic";

const CARDS: {
  label: string;
  hint: string;
  href: string;
  icon: string;
  area: AreaKey;
  count: () => Promise<number>;
}[] = [
  { label: "Propostas", hint: "Eixos de atuação", href: "/admin/propostas", icon: "◆", area: "propostas", count: () => prisma.proposal.count() },
  { label: "Notícias", hint: "Fila e publicações", href: "/admin/noticias", icon: "❖", area: "noticias", count: () => prisma.news.count() },
  { label: "Agenda", hint: "Eventos", href: "/admin/agenda", icon: "▤", area: "agenda", count: () => prisma.event.count() },
  { label: "Mensagens", hint: "Contatos recebidos", href: "/admin/mensagens", icon: "✉", area: "mensagens", count: () => prisma.contact.count() },
];

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  // Quando um guard de permissão redireciona pra cá, `?denied=<área>` explica
  // por que a pessoa não entrou na seção (em vez de um redirect silencioso).
  const sp = await searchParams;
  const deniedMsg = sp.denied
    ? sp.denied === "owner"
      ? "Essa seção é exclusiva do titular da conta."
      : `Você não tem permissão para acessar “${areaLabel(sp.denied)}”. Fale com o titular.`
    : null;

  // Cards só das áreas que o usuário pode acessar (o editor não vê atalho para
  // uma seção que abriria "sem permissão"). O titular vê todos.
  const user = await getCurrentAdmin();
  const cards = user ? CARDS.filter((c) => canAccessArea(user, c.area)) : [];
  const counts = await Promise.all(cards.map((card) => card.count()));

  return (
    <>
      <header className="admin-page-header">
        <span className="admin-page-header__eyebrow">Visão geral</span>
        <h1 className="admin-page-header__title">Dashboard</h1>
        <p className="admin-page-header__subtitle">
          Resumo do conteúdo publicado no site.
        </p>
      </header>

      {deniedMsg ? (
        <div className="admin-note" role="status" style={{ marginBottom: "1.5rem" }}>
          🔒 {deniedMsg}
        </div>
      ) : null}

      <div className="admin-cards">
        {cards.map((card, i) => (
          <Link key={card.label} href={card.href} className="admin-card">
            <span className="admin-card__icon" aria-hidden="true">{card.icon}</span>
            <div className="admin-card__label">{card.label}</div>
            <div className="admin-card__value">{counts[i]}</div>
            <div className="admin-card__hint">{card.hint}</div>
          </Link>
        ))}
      </div>

      <p className="admin-note">
        <strong>Dica.</strong> Cada cartão acima abre a gestão da seção. Em{" "}
        <code>Notícias</code>, a fila traz manchetes ingeridas dos portais de Mato
        Grosso para moderação.
      </p>
    </>
  );
}
