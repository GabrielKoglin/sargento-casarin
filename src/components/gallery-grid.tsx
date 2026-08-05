"use client";

import { useEffect, useRef, useState } from "react";

export type GalleryPhoto = { src: string; alt: string };

export function GalleryGrid({ photos }: { photos: GalleryPhoto[] }) {
  const [active, setActive] = useState<GalleryPhoto | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Ao abrir: move o foco para o dialog e permite fechar com Escape.
  // Ao fechar: restaura o foco para o botão que abriu o lightbox.
  useEffect(() => {
    if (!active) return;
    const trigger = triggerRef.current;
    dialogRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [active]);

  return (
    <>
      <div className="gallery-grid">
        {photos.map((photo) => (
          <button
            type="button"
            className="gallery-item"
            key={photo.src}
            onClick={(e) => {
              triggerRef.current = e.currentTarget;
              setActive(photo);
            }}
            aria-label={`Ampliar foto: ${photo.alt}`}
          >
            <img src={photo.src} alt={photo.alt} />
            <span className="gallery-overlay"></span>
          </button>
        ))}
      </div>

      {active && (
        <div
          ref={dialogRef}
          className="lightbox active"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
          aria-label={active.alt}
          tabIndex={-1}
        >
          <img src={active.src} alt={active.alt} />
          <button type="button" className="lb-close" aria-label="Fechar" onClick={() => setActive(null)}>
            ×
          </button>
        </div>
      )}
    </>
  );
}
