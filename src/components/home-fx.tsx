"use client";

import { useEffect } from "react";

// Efeitos exclusivos da HOME (montado só em src/app/page.tsx). Não toca no
// motor compartilhado (tactical-fx.tsx). Hoje: parallax de profundidade no
// hero seguindo o cursor — as camadas decorativas (mapa, texturas, halftone)
// deslocam levemente em ritmos diferentes, dando sensação de "HUD tático vivo".
// Seguro: só move elementos decorativos; respeita prefers-reduced-motion e só
// roda em ponteiro fino (desktop) — no touch/reduzido não faz nada.
export function HomeFx() {
  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (reduce || !finePointer) return;

    // [elemento, profundidade em px] — quanto maior, mais a camada "flutua".
    const layers: Array<[HTMLElement | null, number]> = [
      [document.getElementById("heroMap"), 26],
      [hero.querySelector<HTMLElement>(".topo-bg"), 16],
      [hero.querySelector<HTMLElement>(".ht-tl"), 34],
      [hero.querySelector<HTMLElement>(".ht-bc"), 40],
    ];

    const active = layers.filter((l): l is [HTMLElement, number] => l[0] !== null);
    if (active.length === 0) return;

    for (const [el] of active) {
      el.style.willChange = "transform";
      // Trailing suave: a transição faz a camada "perseguir" o cursor.
      el.style.transition = "transform .4s cubic-bezier(.22,1,.36,1)";
    }

    let raf = 0;
    let nx = 0;
    let ny = 0;

    const applyFrame = () => {
      raf = 0;
      for (const [el, depth] of active) {
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
      for (const [el] of active) el.style.transform = "translate3d(0,0,0)";
    };

    hero.addEventListener("mousemove", onMove);
    hero.addEventListener("mouseleave", onLeave);

    return () => {
      hero.removeEventListener("mousemove", onMove);
      hero.removeEventListener("mouseleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
      for (const [el] of active) {
        el.style.transform = "";
        el.style.willChange = "";
        el.style.transition = "";
      }
    };
  }, []);

  return null;
}
