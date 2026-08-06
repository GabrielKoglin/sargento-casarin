"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Reproduz o comportamento do main.js do template estático: revela os
// elementos .fi/.sl/.sr/.ribbon ao entrarem na viewport, dispara a varredura
// da seção "por que" e o HUD de digitação do hero.
export function TacticalFx() {
  const pathname = usePathname();

  useEffect(() => {
    const revealEls = document.querySelectorAll<HTMLElement>(".fi, .sl, .sr, .ribbon");
    const reveal = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("on");
            reveal.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12 },
    );
    revealEls.forEach((el) => reveal.observe(el));

    // Revela imediatamente o que já está acima da dobra (caso o IO demore a disparar).
    const viewportH = window.innerHeight;
    revealEls.forEach((el) => {
      if (el.getBoundingClientRect().top < viewportH) {
        el.classList.add("on");
        reveal.unobserve(el);
      }
    });

    // Rede de segurança: garante a exibição de todo o conteúdo mesmo se o
    // IntersectionObserver não disparar (aba em segundo plano, bfcache, etc.).
    const revealFallback = setTimeout(() => {
      revealEls.forEach((el) => el.classList.add("on"));
    }, 2500);

    const whyRight = document.getElementById("whyRight");
    let scan: IntersectionObserver | undefined;
    if (whyRight) {
      scan = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              whyRight.classList.add("scanning");
              scan?.disconnect();
            }
          }
        },
        { threshold: 0.3 },
      );
      scan.observe(whyRight);
    }

    const hud = document.getElementById("hudType");
    let hudTimer: ReturnType<typeof setInterval> | undefined;
    if (hud) {
      const text = "IDENT: SGT CASARIN · MT";
      let i = 0;
      hudTimer = setInterval(() => {
        i += 1;
        hud.textContent = text.slice(0, i) + (i < text.length ? "▌" : "");
        if (i >= text.length) clearInterval(hudTimer);
      }, 55);
    }

    return () => {
      reveal.disconnect();
      scan?.disconnect();
      clearTimeout(revealFallback);
      if (hudTimer) clearInterval(hudTimer);
    };
  }, [pathname]);

  return null;
}
