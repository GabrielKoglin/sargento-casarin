"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SgtBadge } from "@/components/sgt-badge";

const navLinks = [
  { name: "Início", href: "/" },
  { name: "Quem é o Casarin", href: "/sobre" },
  { name: "Propostas", href: "/propostas" },
  { name: "Manifesto", href: "/manifesto" },
  { name: "Notícias", href: "/noticias" },
  { name: "Agenda", href: "/agenda" },
  { name: "Galeria", href: "/galeria" },
  { name: "Contato", href: "/contato" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fecha o menu mobile com Escape ou clique fora — listeners ativos só quando aberto.
  // Gestão de foco (só em modo drawer mobile, i.e. quando o toggle está visível):
  // ao abrir foca o primeiro link do menu; ao fechar (ESC, clique fora ou seleção
  // de link) devolve o foco ao botão .nav-toggle. Espelha o padrão do gallery-grid.
  useEffect(() => {
    if (!open) return;
    const toggle = toggleRef.current;
    // offsetParent é null quando o toggle está display:none (desktop) — nesse caso
    // não mexemos no foco para não interferir na navegação por teclado do desktop.
    const isDrawer = toggle?.offsetParent != null;
    if (isDrawer) menuRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      if (isDrawer) toggle?.focus();
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  const closeMenu = () => setOpen(false);

  return (
    <nav className={`navbar ${scrolled || open ? "scrolled" : ""}`} id="navbar" ref={navRef}>
      <div className="container">
        <Link href="/" className="nav-logo" aria-label="Página inicial" onClick={closeMenu}>
          <span className="nav-wordmark">
            Sgt <em>C<SgtBadge className="nav-badge" />SARIN</em>
          </span>
        </Link>
        <button
          ref={toggleRef}
          type="button"
          className={`nav-toggle ${open ? "open" : ""}`}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          aria-controls="navLinks"
          onClick={() => setOpen(!open)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <ul className={`nav-links ${open ? "open" : ""}`} id="navLinks" ref={menuRef}>
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={isActive(link.href) ? "active" : ""}
                onClick={closeMenu}
              >
                {link.name}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/tropa" className="btn-tropa-nav" onClick={closeMenu}>
              Entre para a Tropa
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
