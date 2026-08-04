import type { Metadata } from "next";
import { GalleryGrid, type GalleryPhoto } from "@/components/gallery-grid";

export const metadata: Metadata = {
  title: "Galeria",
  description: "Fotos do Sargento Dickson Casarin e da pré-campanha em Mato Grosso.",
};

const photos: GalleryPhoto[] = [
  { src: "/DSCF3339.JPG.jpeg", alt: "Sargento Dickson Casarin" },
  { src: "/sargento-recortado.png", alt: "Sargento Dickson Casarin fardado" },
];

export default function GaleriaPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow sl">Registros</div>
          <h1 className="sl d1">
            GALERIA DE <em>CAMPO</em>
          </h1>
          <p className="fi d2">
            Momentos da trajetória e da pré-campanha pelo Mato Grosso. Novas fotos serão
            adicionadas ao longo da caminhada.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <GalleryGrid photos={photos} />
        </div>
      </section>
    </>
  );
}
