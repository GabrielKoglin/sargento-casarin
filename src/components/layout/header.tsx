"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { name: "Início", href: "/" },
  { name: "Quem é o Casarin", href: "/sobre" },
  { name: "Propostas", href: "/propostas" },
  { name: "Manifesto", href: "/manifesto" },
  { name: "Notícias", href: "/noticias" },
  { name: "Galeria", href: "/galeria" },
  { name: "Contato", href: "/contato" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <nav className={`navbar ${scrolled || open ? "scrolled" : ""}`} id="navbar">
      <div className="container">
        <Link href="/" className="nav-logo" aria-label="Página inicial">
          <span className="nav-wordmark">
            Sgt <em>Casarin</em>
          </span>
        </Link>
        <button
          type="button"
          className="nav-toggle"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <ul className={`nav-links ${open ? "open" : ""}`} id="navLinks">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={pathname === link.href ? "active" : ""}>
                {link.name}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/tropa" className="btn-tropa-nav">
              Entre para a Tropa
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
