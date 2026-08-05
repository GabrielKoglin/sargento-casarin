// ============================================================================
// admin/(app)/page.tsx — Dashboard (/admin)
// ============================================================================
// Herda o shell + guarda de sessão de `(app)/layout.tsx`.
import { prisma } from "@/lib/prisma";

// Contadores são sempre "ao vivo" — nunca pré-renderizar em build.
export const dynamic = "force-dynamic";

const CARDS: {
  label: string;
  hint: string;
  count: () => Promise<number>;
}[] = [
  { label: "Propostas", hint: "Eixos de atuação", count: () => prisma.proposal.count() },
  { label: "Notícias", hint: "Publicações", count: () => prisma.news.count() },
  { label: "Agenda", hint: "Eventos", count: () => prisma.event.count() },
  { label: "Mensagens", hint: "Contatos recebidos", count: () => prisma.contact.count() },
];

export default async function AdminDashboardPage() {
  const counts = await Promise.all(CARDS.map((card) => card.count()));

  return (
    <>
      <header className="admin-page-header">
        <span className="admin-page-header__eyebrow">Visão geral</span>
        <h1 className="admin-page-header__title">Dashboard</h1>
        <p className="admin-page-header__subtitle">
          Resumo do conteúdo publicado no site.
        </p>
      </header>

      <div className="admin-cards">
        {CARDS.map((card, i) => (
          <article key={card.label} className="admin-card">
            <div className="admin-card__label">{card.label}</div>
            <div className="admin-card__value">{counts[i]}</div>
            <div className="admin-card__hint">{card.hint}</div>
          </article>
        ))}
      </div>

      <p className="admin-note">
        <strong>Fase 1 — Fundação de autenticação.</strong> As telas de gestão
        (propostas, notícias, agenda, mensagens e configurações) serão criadas na
        Fase 2, dentro de <code>src/app/admin/(app)/</code>, herdando este painel
        e a proteção de sessão.
      </p>
    </>
  );
}
