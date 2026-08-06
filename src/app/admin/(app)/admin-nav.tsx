"use client";

// Navegação da sidebar do painel. É client SÓ para marcar o link ativo via
// usePathname (o layout é Server Component e não tem o pathname). O CSS já
// estiliza `.admin-nav__link[aria-current="page"]`; aqui só setamos o atributo.
import Link from "next/link";
import { usePathname } from "next/navigation";

export type AdminNavItem = { href: string; label: string; icon?: string };

export function AdminNav({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname();

  // "/admin" só casa exato (senão ficaria ativo em todas as sub-rotas);
  // as demais casam a própria rota e qualquer sub-rota (ex.: /admin/midia/nova).
  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="admin-nav" aria-label="Navegação do painel">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="admin-nav__link"
          aria-current={isActive(item.href) ? "page" : undefined}
        >
          {item.icon ? (
            <span className="admin-nav__icon" aria-hidden="true">
              {item.icon}
            </span>
          ) : null}
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
