import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notícias",
  description: "Acompanhe as novidades da campanha do Sargento Dickson Casarin.",
};

const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" });

export default async function NoticiasPage() {
  // Só notícias APROVADAS vão ao público — as ingeridas dos feeds ficam
  // "pending" até o admin aprovar (moderação). `take` evita renderizar milhares.
  const noticias = await prisma.news.findMany({
    where: { status: "approved" },
    orderBy: { publishedAt: "desc" },
    take: 30,
  });

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow sl">Boletim</div>
          <h1 className="sl d1">
            ÚLTIMAS <em>NOTÍCIAS</em>
          </h1>
          <p className="fi d2">
            Novidades da campanha e a presença do Sargento Casarin na imprensa.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {noticias.length === 0 ? (
            <div style={{ textAlign: "center", maxWidth: "560px", margin: "0 auto", padding: "3.5rem 0" }}>
              <div aria-hidden="true" style={{ fontSize: "2.75rem", marginBottom: "1rem", opacity: 0.75 }}>
                📡
              </div>
              <h2
                className="d-md"
                style={{ color: "var(--W)", fontSize: "clamp(1.75rem,4.5vw,2.75rem)", marginBottom: "1rem" }}
              >
                SEM TRANSMISSÕES{" "}
                <em style={{ fontStyle: "normal", color: "var(--B)" }}>NO MOMENTO</em>
              </h2>
              <p style={{ color: "rgba(255,255,255,.55)", lineHeight: 1.75, marginBottom: "2rem" }}>
                Ainda não há notícias publicadas. Entre nos nossos grupos e receba as novidades em
                primeira mão.
              </p>
              <Link href="/tropa" className="btn btn-gold">
                Nossos Grupos <span aria-hidden="true">➔</span>
              </Link>
            </div>
          ) : (
            <>
            <h2 className="sr-only">Últimas publicações</h2>
            <div className="news-grid">
              {noticias.map((noticia) => {
                const card = (
                  <article className="news-card" key={noticia.id}>
                    <div className="news-card-img">
                      {noticia.image ? (
                        /* Imagem remota de host arbitrário (vem do banco/CMS); next/image
                           exige hostname fixo em images.remotePatterns, então mantemos <img>. */
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={noticia.image} alt="" />
                      ) : (
                        <div className="news-ph" aria-hidden="true">📰</div>
                      )}
                    </div>
                    <div className="news-body">
                      <span className="news-tag">{noticia.source}</span>
                      <h3>{noticia.title}</h3>
                      <p>{noticia.summary}</p>
                      <div className="news-date">{dateFormat.format(noticia.publishedAt)}</div>
                    </div>
                  </article>
                );
                return noticia.url ? (
                  <a href={noticia.url} target="_blank" rel="noopener noreferrer" key={noticia.id}>
                    {card}
                  </a>
                ) : (
                  card
                );
              })}
            </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
