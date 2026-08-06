"use client";

// ============================================================================
// src/components/cookie-consent.tsx — banner de consentimento de cookies (LGPD)
// ============================================================================
// Aparece na PRIMEIRA visita pedindo consentimento. A escolha ("accepted" |
// "rejected") é gravada em localStorage["cookie-consent"] e o banner some — não
// reaparece nas próximas visitas. Não integra com analytics real: só registra a
// preferência (base para ativar/desativar medição depois).
//
// SSR-safe / sem flash: `visible` começa false, então tanto o SSR quanto o
// primeiro render no cliente devolvem null (sem mismatch de hidratação). Só
// depois de montar, dentro do useEffect (único lugar que toca window/
// localStorage), é que decidimos exibir. Estilos 100% inline (não depende do
// globals.css).

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "cookie-consent";
type Consent = "accepted" | "rejected";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false); // dispara a animação de entrada
  const [isNarrow, setIsNarrow] = useState(false); // layout responsivo (empilha)
  const [reduceMotion, setReduceMotion] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Decisão de exibir + wiring das media queries — só no cliente (pós-mount).
  // O setState mora dentro dos callbacks (padrão "subscrever + inicializar",
  // como no Header): evitamos setState síncrono direto no corpo do efeito.
  useEffect(() => {
    const narrowMq = window.matchMedia("(max-width: 640px)");
    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncNarrow = () => setIsNarrow(narrowMq.matches);
    const syncMotion = () => setReduceMotion(motionMq.matches);
    narrowMq.addEventListener("change", syncNarrow);
    motionMq.addEventListener("change", syncMotion);
    syncNarrow();
    syncMotion();

    // Lê o consentimento salvo; se ainda não houver, exibe o banner. Em modo
    // privado/bloqueado o localStorage pode lançar — nesse caso, mostramos.
    const decideVisibility = () => {
      let stored: string | null = null;
      try {
        stored = window.localStorage.getItem(STORAGE_KEY);
      } catch {
        stored = null;
      }
      if (stored !== "accepted" && stored !== "rejected") setVisible(true);
    };
    decideVisibility();

    return () => {
      narrowMq.removeEventListener("change", syncNarrow);
      motionMq.removeEventListener("change", syncMotion);
    };
  }, []);

  // Entrada suave + foco acessível quando o banner passa a ser exibido. O
  // setState acontece dentro do requestAnimationFrame (callback assíncrono), e
  // a transição é desligada quando o usuário pede menos movimento.
  useEffect(() => {
    if (!visible) return;
    dialogRef.current?.focus({ preventScroll: true });
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [visible]);

  function decide(value: Consent) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // best-effort: se não der para gravar, ao menos some nesta sessão.
    }
    setVisible(false);
  }

  // Sem flash no SSR: nada é renderizado até decidir mostrar no cliente.
  if (!visible) return null;

  const wrap: React.CSSProperties = {
    position: "fixed",
    zIndex: 9995, // acima do conteúdo; não sobrepõe o FAB (posicionado longe dele)
    // Longe do FAB do WhatsApp (canto inferior direito, .wa-float):
    //  - telas largas: card ancorado à esquerda terminando bem antes do FAB.
    //  - telas estreitas: card acima do FAB (bottom elevado), largura cheia.
    bottom: isNarrow ? "5.5rem" : "1.5rem",
    left: isNarrow ? "0.75rem" : "1.5rem",
    right: isNarrow ? "0.75rem" : "6.5rem",
    maxWidth: isNarrow ? undefined : 720,
    boxSizing: "border-box",
    background: "#04111f",
    border: "1px solid rgba(0,184,75,.25)",
    borderRadius: 14,
    boxShadow: "0 18px 50px rgba(0,0,0,.55)",
    padding: isNarrow ? "1rem 1.1rem" : "1rem 1.25rem",
    color: "#e6edf3",
    display: "flex",
    flexDirection: isNarrow ? "column" : "row",
    alignItems: isNarrow ? "stretch" : "center",
    gap: isNarrow ? "0.85rem" : "1.25rem",
    fontSize: "0.9rem",
    lineHeight: 1.5,
    opacity: entered ? 1 : 0,
    transform: entered ? "translateY(0)" : "translateY(8px)",
    transition: reduceMotion ? "none" : "opacity .3s ease, transform .3s ease",
  };

  const textStyle: React.CSSProperties = { flex: 1, margin: 0 };

  const linkStyle: React.CSSProperties = {
    color: "#00b84b",
    textDecoration: "underline",
    fontWeight: 600,
    whiteSpace: "nowrap",
  };

  const actions: React.CSSProperties = {
    display: "flex",
    gap: "0.6rem",
    flexShrink: 0,
    flexWrap: "wrap",
  };

  const baseBtn: React.CSSProperties = {
    padding: "0.6rem 1.1rem",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: "0.85rem",
    lineHeight: 1.2,
    flex: isNarrow ? "1 1 130px" : "0 0 auto",
    whiteSpace: "nowrap",
  };

  const ghostBtn: React.CSSProperties = {
    ...baseBtn,
    background: "transparent",
    color: "#e6edf3",
    border: "1px solid rgba(255,255,255,.28)",
    fontWeight: 600,
  };

  const acceptBtn: React.CSSProperties = {
    ...baseBtn,
    background: "#00b84b",
    color: "#04111f",
    border: "1px solid #00b84b",
    fontWeight: 700,
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-label="Consentimento de cookies"
      tabIndex={-1}
      style={wrap}
    >
      <p style={textStyle}>
        Usamos cookies para melhorar sua experiência e medir audiência, conforme
        a LGPD. Você pode aceitar ou usar apenas os essenciais.{" "}
        <Link href="/cookies" style={linkStyle}>
          Saiba mais
        </Link>
      </p>
      <div style={actions}>
        <button type="button" onClick={() => decide("rejected")} style={ghostBtn}>
          Apenas essenciais
        </button>
        <button type="button" onClick={() => decide("accepted")} style={acceptBtn}>
          Aceitar
        </button>
      </div>
    </div>
  );
}
