// ============================================================================
// admin/(app)/page.tsx — Dashboard (/admin)
// ============================================================================
// Herda o shell + guarda de sessão de `(app)/layout.tsx`.
import Link from "next/link";
import { prisma } from "@/lib/prisma";

// Contadores são sempre "ao vivo" — nunca pré-renderizar em build.
export const dynamic = "force-dynamic";

const CARDS: {
  label: string;
  hint: string;
  href: string;
  icon: string;
  count: () => Promise<number>;
}[] = [
  { label: "Propostas", hint: "Eixos de atuação", href: "/admin/propostas", icon: "◆", count: () => prisma.proposal.count() },
  { label: "Notícias", hint: "Fila e publicações", href: "/admin/noticias", icon: "❖", count: () => prisma.news.count() },
  { label: "Agenda", hint: "Eventos", href: "/admin/agenda", icon: "▤", count: () => prisma.event.count() },
  { label: "Mensagens", hint: "Contatos recebidos", href: "/admin/mensagens", icon: "✉", count: () => prisma.contact.count() },
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
