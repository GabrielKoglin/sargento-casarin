"use client";

import { useState } from "react";

export type GalleryPhoto = { src: string; alt: string };

export function GalleryGrid({ photos }: { photos: GalleryPhoto[] }) {
  const [active, setActive] = useState<GalleryPhoto | null>(null);

  return (
    <>
      <div className="gallery-grid">
        {photos.map((photo) => (
          <button
            type="button"
            className="gallery-item"
            key={photo.src}
            onClick={() => setActive(photo)}
            aria-label={`Ampliar foto: ${photo.alt}`}
          >
            <img src={photo.src} alt={photo.alt} />
            <span className="gallery-overlay"></span>
          </button>
        ))}
      </div>

      <div
        className={`lightbox ${active ? "active" : ""}`}
        onClick={() => setActive(null)}
        role="dialog"
        aria-modal="true"
      >
        {active && <img src={active.src} alt={active.alt} />}
        <button type="button" className="lb-close" aria-label="Fechar" onClick={() => setActive(null)}>
          ×
        </button>
      </div>
    </>
  );
}
