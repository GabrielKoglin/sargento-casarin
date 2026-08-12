"use client";

// ============================================================================
// welcome-popup.tsx — modal de boas-vindas (aparece no 1º acesso da sessão)
// ============================================================================
// Aparece "de cara" quando alguém entra no site, com os 4 caminhos de
// participação. Mostra UMA vez por sessão (sessionStorage) para não repetir a
// cada navegação. Acessível: role=dialog + aria-modal, foco preso no card, Esc
// e clique no fundo fecham, e o foco volta para onde estava. SSR-safe: só
// aparece após o efeito no cliente (nada toca window no render).
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const SEEN_KEY = "casarin_welcome_seen";

type Action = {
  label: string;
  href: string;
  icon: string;
  external?: boolean;
  variant: "gold" | "green";
};

const ACTIONS: Action[] = [
  { label: "Quero meu adesivo", href: "/adesivos", icon: "🏷️", variant: "gold" },
  { label: "Seja um líder apoiador", href: "/tropa", icon: "🎖️", variant: "gold" },
  { label: "Quero ajudar", href: "/ajudar", icon: "💲", variant: "green" },
  {
    label: "Comunidade",
    href: "https://wpgrupos.spx.ia.br/entrar",
    icon: "👥",
    external: true,
    variant: "green",
  },
];

export function WelcomePopup() {
  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  // O painel admin herda o layout raiz — mas o popup é só para o site público.
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  // 1º acesso da sessão → abre com um pequeno atraso (deixa a home pintar antes).
  useEffect(() => {
    if (isAdmin) return;
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      seen = false;
    }
    if (seen) return;
    const t = setTimeout(() => setOpen(true), 550);
    return () => clearTimeout(t);
  }, [isAdmin]);

  const close = useCallback(() => setOpen(false), []);

  // Enquanto aberto: marca como visto, prende o foco, trava o scroll do body,
  // Esc fecha e o foco volta para o elemento anterior ao fechar.
  useEffect(() => {
    if (!open) return;
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* modo privado pode barrar — tudo bem, só reaparece na próxima */
    }

    const prevFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab" || !cardRef.current) return;
      const nodes = cardRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      className="welcome-backdrop"
      role="presentation"
      onClick={close}
    >
      <div
        className="welcome-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        ref={cardRef}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          ref={closeRef}
          className="welcome-close"
          onClick={close}
          aria-label="Fechar"
        >
          ×
        </button>

        <span className="welcome-eyebrow">Sargento Casarin</span>
        <h2 id="welcome-title" className="welcome-title">
          Faça parte dessa <em>missão</em>
        </h2>
        <p className="welcome-sub">Escolha como você quer participar da campanha:</p>

        <div className="welcome-actions">
          {ACTIONS.map((a, i) => {
            const style = { animationDelay: `${0.12 + i * 0.08}s` };
            const cls = `welcome-btn welcome-btn--${a.variant}`;
            const inner = (
              <>
                <span className="welcome-btn__ico" aria-hidden="true">
                  {a.icon}
                </span>
                {a.label}
              </>
            );
            return a.external ? (
              <a
                key={a.href}
                href={a.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cls}
                style={style}
                onClick={close}
              >
                {inner}
              </a>
            ) : (
              <Link key={a.href} href={a.href} className={cls} style={style} onClick={close}>
                {inner}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
