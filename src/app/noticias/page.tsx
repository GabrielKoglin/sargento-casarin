import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notícias",
  description: "Acompanhe as novidades da pré-campanha do Sargento Dickson Casarin.",
};

const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" });

export default async function NoticiasPage() {
  const noticias = await prisma.news.findMany({
    orderBy: { publishedAt: "desc" },
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
            Novidades da pré-campanha e a presença do Sargento Casarin na imprensa.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {noticias.length === 0 ? (
            <div className="priv-body">
              <p>
                Nenhuma notícia publicada por enquanto. Entre para a{" "}
                <Link href="/tropa" style={{ color: "var(--B)" }}>
                  Tropa
                </Link>{" "}
                para receber as novidades em primeira mão.
              </p>
            </div>
          ) : (
            <div className="news-grid">
              {noticias.map((noticia) => {
                const card = (
                  <article className="news-card" key={noticia.id}>
                    <div className="news-card-img">
                      {noticia.image ? (
                        <img src={noticia.image} alt={noticia.title} />
                      ) : (
                        <div className="news-ph">📰</div>
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
          )}
        </div>
      </section>
    </>
  );
}
