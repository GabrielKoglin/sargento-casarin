import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { News } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notícias",
  description: "Acompanhe as novidades da campanha do Sargento Dickson Casarin.",
};

const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" });

// Duas naturezas, buscadas SEPARADAMENTE para que as matérias próprias nunca
// sejam empurradas para fora pela enxurrada de manchetes agregadas:
//   • próprias  = escritas pela equipe (têm `content`) → seção "Da campanha"
//   • na imprensa = ingeridas dos feeds (sem `content`) → seção "Na imprensa"
// Só APROVADAS vão ao público (as ingeridas ficam "pending" até moderação).
// Falha de I/O em qualquer uma vira lista vazia (empty-state), nunca 500.
async function loadNoticias(): Promise<{ proprias: News[]; imprensa: News[] }> {
  try {
    const [proprias, imprensa] = await Promise.all([
      prisma.news.findMany({
        where: { status: "approved", content: { not: null } },
        orderBy: { publishedAt: "desc" },
        take: 24,
      }),
      prisma.news.findMany({
        where: { status: "approved", content: null },
        orderBy: { publishedAt: "desc" },
        take: 30,
      }),
    ]);
    return { proprias, imprensa };
  } catch (error) {
    console.error("Falha ao carregar notícias.", error);
    return { proprias: [], imprensa: [] };
  }
}

// Card de notícia. Matéria de autoria (tem `content`) abre a página NO SITE;
// manchete agregada abre o portal de origem (link externo em nova aba).
function NewsCard({ noticia }: { noticia: News }) {
  const own = Boolean(noticia.content);
  const card = (
    <article className="news-card">
      <div className="news-card-img">
        {noticia.image ? (
          /* Imagem remota de host arbitrário (vem do banco/CMS); next/image
             exige hostname fixo em images.remotePatterns, então mantemos <img>. */
          // eslint-disable-next-line @next/next/no-img-element
          <img src={noticia.image} alt="" loading="lazy" decoding="async" />
        ) : (
          <div className="news-ph" aria-hidden="true">📰</div>
        )}
        {own && <span className="news-badge">★ Matéria</span>}
      </div>
      <div className="news-body">
        <span className="news-tag">{noticia.source}</span>
        <h3>{noticia.title}</h3>
        <p>{noticia.summary}</p>
        <div className="news-date">
          {dateFormat.format(noticia.publishedAt)}
          {own ? <span className="news-more"> · Ler no site ➔</span> : null}
        </div>
      </div>
    </article>
  );

  if (own) {
    return <Link href={`/noticias/${noticia.slug}`}>{card}</Link>;
  }
  return noticia.url ? (
    <a href={noticia.url} target="_blank" rel="noopener noreferrer">
      {card}
    </a>
  ) : (
    <div>{card}</div>
  );
}

export default async function NoticiasPage() {
  const { proprias, imprensa } = await loadNoticias();
  const vazio = proprias.length === 0 && imprensa.length === 0;

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
          {vazio ? (
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
              {/* MATÉRIAS DA CAMPANHA (autoria própria) */}
              {proprias.length > 0 && (
                <div className="news-block">
                  <header className="news-section-head">
                    <span className="eyebrow">Da campanha</span>
                    <h2 className="news-section-title">
                      NOSSAS <em>MATÉRIAS</em>
                    </h2>
                  </header>
                  <div className="news-grid">
                    {proprias.map((noticia) => (
                      <NewsCard key={noticia.id} noticia={noticia} />
                    ))}
                  </div>
                </div>
              )}

              {/* NA IMPRENSA (agregadas automaticamente dos portais) */}
              {imprensa.length > 0 && (
                <div className="news-block">
                  <header className="news-section-head">
                    <span className="eyebrow">Cobertura da mídia</span>
                    <h2 className="news-section-title">
                      NA <em>IMPRENSA</em>
                    </h2>
                    <p className="news-section-sub">
                      Manchetes dos portais de Mato Grosso que citam o Sargento
                      Casarin. Clique para ler no site de origem.
                    </p>
                  </header>
                  <div className="news-grid">
                    {imprensa.map((noticia) => (
                      <NewsCard key={noticia.id} noticia={noticia} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
