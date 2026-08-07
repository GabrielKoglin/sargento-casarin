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

// Busca fotos e vídeos publicados. O ADMIN é a única fonte de verdade: se não há
// fotos cadastradas (ou o titular apagou todas), a galeria mostra o estado vazio
// — NÃO usamos mais fallback estático (senão fotos apagadas "voltavam" ao ficar
// o banco vazio). Falha de I/O também vira galeria vazia (não derruba a página).
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

    const photos: GalleryPhoto[] = photoRows.map((row) => ({
      src: row.src,
      alt: row.title ?? "Sargento Dickson Casarin",
    }));

    const videos: VideoItem[] = videoRows.map((row) => ({
      src: row.src,
      poster: row.poster,
      title: row.title,
    }));

    return { photos, videos };
  } catch (error) {
    console.error("Falha ao carregar a galeria.", error);
    return { photos: [], videos: [] };
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
          {photos.length > 0 ? (
            <GalleryGrid photos={photos} />
          ) : (
            <p className="gallery-empty">
              As fotos da campanha serão publicadas em breve.
            </p>
          )}
        </div>
      </section>

      {videos.length > 0 && (
        <section className="section">
          <div className="container">
            <h2 className="sl videos-head" style={{ marginBottom: "1.5rem" }}>
              VÍDEOS
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))",
                gap: "1.5rem",
                // Embeds verticais (Reel/TikTok) têm alturas diferentes — alinha
                // cada célula ao topo em vez de esticar.
                alignItems: "start",
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
                    <p className="video-cap">{video.title}</p>
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
