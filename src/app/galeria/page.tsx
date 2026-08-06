import type { Metadata } from "next";
import { GalleryGrid, type GalleryPhoto } from "@/components/gallery-grid";
import { VideoEmbed, type VideoItem } from "@/components/video-embed";
import { prisma } from "@/lib/prisma";

// Lê fotos/vídeos do banco a cada request — nunca pré-renderizar em build.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Galeria",
  description: "Fotos do Sargento Dickson Casarin e da campanha em Mato Grosso.",
};

// Fallback estático: a galeria NUNCA fica vazia. Usado quando ainda não há
// fotos cadastradas no banco (ou se a leitura falhar).
const FALLBACK_PHOTOS: GalleryPhoto[] = [
  { src: "/DSCF3339.JPG.jpeg", alt: "Sargento Dickson Casarin" },
  { src: "/sargento-recortado.png", alt: "Sargento Dickson Casarin fardado" },
];

// Busca fotos e vídeos publicados. Uma falha de I/O não pode derrubar a página
// pública: cai no fallback de fotos e em nenhuma seção de vídeos.
async function loadGallery(): Promise<{
  photos: GalleryPhoto[];
  videos: VideoItem[];
}> {
  try {
    const [photoRows, videoRows] = await Promise.all([
      prisma.media.findMany({
        where: { type: "photo", published: true },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      }),
      prisma.media.findMany({
        where: { type: "video", published: true },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      }),
    ]);

    const photos: GalleryPhoto[] =
      photoRows.length > 0
        ? photoRows.map((row) => ({
            src: row.src,
            alt: row.title ?? "Sargento Dickson Casarin",
          }))
        : FALLBACK_PHOTOS;

    const videos: VideoItem[] = videoRows.map((row) => ({
      src: row.src,
      poster: row.poster,
      title: row.title,
    }));

    return { photos, videos };
  } catch (error) {
    console.error("Falha ao carregar a galeria.", error);
    return { photos: FALLBACK_PHOTOS, videos: [] };
  }
}

export default async function GaleriaPage() {
  const { photos, videos } = await loadGallery();

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow sl">Registros</div>
          <h1 className="sl d1">
            GALERIA DE <em>CAMPO</em>
          </h1>
          <p className="fi d2">
            Momentos da trajetória e da campanha pelo Mato Grosso. Novas fotos serão
            adicionadas ao longo da caminhada.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <GalleryGrid photos={photos} />
        </div>
      </section>

      {videos.length > 0 && (
        <section className="section">
          <div className="container">
            <h2 className="sl" style={{ marginBottom: "1.5rem" }}>
              VÍDEOS
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "1.5rem",
              }}
            >
              {videos.map((video, index) => (
                <div key={`${video.src}-${index}`}>
                  <VideoEmbed
                    src={video.src}
                    poster={video.poster}
                    title={video.title}
                  />
                  {video.title ? (
                    <p
                      style={{
                        margin: "0.6rem 0 0",
                        fontSize: "0.95rem",
                        fontWeight: 600,
                      }}
                    >
                      {video.title}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
