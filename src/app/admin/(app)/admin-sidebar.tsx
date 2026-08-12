"use client";

// ============================================================================
// admin-sidebar.tsx — navegação do painel (sidebar no desktop, drawer no mobile)
// ============================================================================
// Client component: precisa de estado (drawer aberto/fechado) e do pathname
// para marcar o link ativo. No DESKTOP (>860px) o <aside> é a coluna fixa de
// sempre — o CSS esconde a top bar e o backdrop. No MOBILE (≤860px) o <aside>
// vira um drawer off-canvas aberto pela top bar (hambúrguer); a mesma marcação
// serve aos dois layouts, só o CSS muda.
//
// `logout` é um Server Action importado direto no client — padrão do App Router
// para usar `<form action={serverAction}>` dentro de um componente "use client".
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiGrid,
  FiFileText,
  FiRss,
  FiCalendar,
  FiImage,
  FiEdit3,
  FiMail,
  FiTag,
  FiUsers,
  FiShield,
  FiSettings,
} from "react-icons/fi";
import type { IconType } from "react-icons";
import { logout } from "../actions";
import type { AdminNavItem } from "./admin-nav";

// Chave (definida no layout) → ícone (Feather/react-icons).
const NAV_ICONS: Record<string, IconType> = {
  dashboard: FiGrid,
  propostas: FiFileText,
  noticias: FiRss,
  agenda: FiCalendar,
  midia: FiImage,
  conteudo: FiEdit3,
  mensagens: FiMail,
  adesivos: FiTag,
  equipe: FiUsers,
  seguranca: FiShield,
  config: FiSettings,
};

export function AdminSidebar({
  items,
  email,
}: {
  items: AdminNavItem[];
  email: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // "/admin" casa exato; as demais casam a própria rota e sub-rotas.
  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(href + "/");

  // Enquanto o drawer está aberto: trava o scroll do fundo e fecha no Esc.
  // (Efeito só com side-effects de DOM — nada de setState no corpo do efeito.)
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      {/* Top bar — visível só no mobile (CSS). */}
      <header className="admin-topbar">
        <Link
          href="/admin"
          className="admin-topbar__brand"
          aria-label="Painel Casarin — início"
        >
          <span className="admin-topbar__eyebrow">Painel</span>
          <span className="admin-topbar__title">Casarin</span>
        </Link>
        <button
          type="button"
          className="admin-burger"
          aria-label="Abrir menu"
          aria-expanded={open}
          aria-controls="admin-drawer"
          onClick={() => setOpen(true)}
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      {/* Backdrop do drawer (mobile). */}
      <div
        className={`admin-drawer-backdrop${open ? " is-open" : ""}`}
        onClick={close}
        aria-hidden="true"
      />

      <aside
        id="admin-drawer"
        className={`admin-sidebar${open ? " is-open" : ""}`}
      >
        <button
          type="button"
          className="admin-drawer-close"
          aria-label="Fechar menu"
          onClick={close}
        >
          ✕
        </button>

        <Link
          href="/admin"
          className="admin-sidebar__brand"
          aria-label="Painel Casarin — início"
          onClick={close}
        >
          <span className="admin-sidebar__brand-eyebrow">Painel</span>
          <span className="admin-sidebar__brand-title">Casarin</span>
        </Link>

        <nav className="admin-nav" aria-label="Navegação do painel">
          {items.map((item) => {
            const Icon = item.icon ? NAV_ICONS[item.icon] : undefined;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="admin-nav__link"
                aria-current={isActive(item.href) ? "page" : undefined}
                onClick={close}
              >
                {Icon ? <Icon className="admin-nav__icon" aria-hidden="true" /> : null}
                <span>{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span
                    className="admin-nav__badge"
                    aria-label={`${item.badge} não lidas`}
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-user" title={email}>
            <span className="admin-user__label">Sessão</span>
            <span className="admin-user__email">{email}</span>
          </div>
          <form action={logout}>
            <button type="submit" className="admin-logout">
              Sair
            </button>
          </form>

          <p className="admin-credit">
            Desenvolvido por{" "}
            <a
              className="admin-dev"
              href="https://www.devgabrielkoglin.com.br"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Gabriel Koglin</span>
            </a>
          </p>
        </div>
      </aside>
    </>
  );
}
