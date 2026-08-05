"use client";

import { useEffect } from "react";

// Efeitos exclusivos da HOME (montado só em src/app/page.tsx). Não toca no
// motor compartilhado (tactical-fx.tsx). Hoje: parallax de profundidade no
// hero seguindo o cursor — várias camadas decorativas (mapa, texturas,
// halftone, rótulos de HUD e cruzes) deslocam em ritmos diferentes, dando a
// sensação de uma moldura de HUD tático viva.
// Seguro: só move elementos decorativos (todos sem transform base); respeita
// prefers-reduced-motion e só roda em ponteiro fino (desktop) — no touch ou
// com movimento reduzido não faz nada.
export function HomeFx() {
  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (reduce || !finePointer) return;

    // [seletor (dentro do hero), profundidade em px]. Quanto maior, mais a
    // camada "flutua". Camadas de fundo (mapa/texturas) fundas; HUD/cruzes rasas.
    // Nota: o mapa (#heroMap) NÃO entra no parallax — o usuário quer ele estático.
    const groups: Array<[string, number]> = [
      [".ht-tl", 34],
      [".ht-bc", 40],
      [".hud", 10],
      [".hud-cross", 18],
    ];

    const els: Array<[HTMLElement, number]> = [];
    for (const [sel, depth] of groups) {
      hero.querySelectorAll<HTMLElement>(sel).forEach((el) => els.push([el, depth]));
    }
    if (els.length === 0) return;

    for (const [el] of els) {
      el.style.willChange = "transform";
      // Trailing suave: a transição faz a camada "perseguir" o cursor.
      el.style.transition = "transform .4s cubic-bezier(.22,1,.36,1)";
    }

    let raf = 0;
    let nx = 0;
    let ny = 0;

    const applyFrame = () => {
      raf = 0;
      for (const [el, depth] of els) {
        el.style.transform = `translate3d(${(-nx * depth).toFixed(1)}px, ${(-ny * depth).toFixed(1)}px, 0)`;
      }
    };

    const onMove = (e: MouseEvent) => {
      const r = hero.getBoundingClientRect();
      // -0.5..0.5 a partir do centro do hero.
      nx = (e.clientX - r.left) / r.width - 0.5;
      ny = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(applyFrame);
    };

    const onLeave = () => {
      nx = 0;
      ny = 0;
      for (const [el] of els) el.style.transform = "translate3d(0,0,0)";
    };

    hero.addEventListener("mousemove", onMove);
    hero.addEventListener("mouseleave", onLeave);

    return () => {
      hero.removeEventListener("mousemove", onMove);
      hero.removeEventListener("mouseleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
      for (const [el] of els) {
        el.style.transform = "";
        el.style.willChange = "";
        el.style.transition = "";
      }
    };
  }, []);

  return null;
}
