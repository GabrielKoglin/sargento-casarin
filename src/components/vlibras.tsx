"use client";

// ============================================================================
// src/components/vlibras.tsx — VLibras (tradução em Libras) do governo federal
// ============================================================================
// Injeta a marca-d'água de markup exigida pelo plugin oficial (vlibras.gov.br) e
// carrega o script dinamicamente UMA vez; no onload chama new VLibras.Widget().
//
// SSR-safe: o render devolve só um container vazio (nada toca window). Toda a
// injeção (markup + <script>) acontece dentro do useEffect, com guardas de
// idempotência (StrictMode/remontagem não duplicam). Degrada com elegância: se
// o script não carregar/inicializar, faz console.error e a página segue normal.
//
// POSIÇÃO: o botão de acesso é movido para o canto inferior ESQUERDO via CSS no
// globals.css ([vw]/[vw-access-button]) para não colidir com o FAB do assistente
// (canto inferior direito).

import { useEffect, useRef } from "react";

const SCRIPT_ID = "vlibras-plugin-script";
const VLIBRAS_APP = "https://vlibras.gov.br/app";
const VLIBRAS_SRC = "https://vlibras.gov.br/app/vlibras-plugin.js";

// Marca-d'água exigida pelo VLibras. Usa atributos não-padrão ([vw],
// [vw-access-button]...) que não existem na tipagem JSX — por isso é injetada
// como HTML (via innerHTML no useEffect), não como JSX.
const VLIBRAS_MARKUP =
  '<div vw class="enabled">' +
  '<div vw-access-button class="active"></div>' +
  '<div vw-plugin-wrapper>' +
  '<div class="vw-plugin-top-wrapper"></div>' +
  "</div>" +
  "</div>";

// window.VLibras não existe no lib.dom — tipamos localmente o mínimo.
interface VLibrasGlobal {
  Widget: new (app: string) => unknown;
}

// Garante que o Widget seja construído no máximo uma vez por aba (evita
// duplicação sob StrictMode/remontagem).
let widgetStarted = false;

export function VLibras() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Injeta a marca-d'água só se ainda não existir no documento (o plugin pode
    // movê-la para fora do container ao inicializar).
    if (!document.querySelector("[vw]")) {
      container.innerHTML = VLIBRAS_MARKUP;
    }

    const initWidget = () => {
      if (widgetStarted) return;
      try {
        const w = window as unknown as { VLibras?: VLibrasGlobal };
        if (w.VLibras?.Widget) {
          new w.VLibras.Widget(VLIBRAS_APP);
          widgetStarted = true;
        }
      } catch (err) {
        console.error("VLibras: falha ao inicializar o widget.", err);
      }
    };

    // Script já disponível (outra montagem já carregou) → só inicializa.
    const w = window as unknown as { VLibras?: VLibrasGlobal };
    if (w.VLibras?.Widget) {
      initWidget();
      return;
    }

    // Script já injetado mas ainda carregando → espera o load existente.
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", initWidget, { once: true });
      return;
    }

    // Primeira vez: injeta o <script> async.
    try {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = VLIBRAS_SRC;
      script.async = true;
      script.addEventListener("load", initWidget, { once: true });
      script.addEventListener("error", () => {
        console.error("VLibras: não foi possível carregar o plugin (offline?).");
      });
      document.body.appendChild(script);
    } catch (err) {
      console.error("VLibras: erro ao injetar o script do plugin.", err);
    }
  }, []);

  // SSR-safe: só um container. A marca-d'água entra via useEffect (nada no render).
  return <div ref={containerRef} />;
}
