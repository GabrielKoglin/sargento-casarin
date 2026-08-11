import { Fragment } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Proposal } from "@/generated/prisma/client";
import { getSiteContent, renderRich } from "@/lib/site-content";
import { HomeFx } from "@/components/home-fx";

export const dynamic = "force-dynamic";

// A home é a porta de entrada — um soluço do banco não pode derrubá-la. Em
// falha de I/O cai numa lista vazia (a seção de propostas mostra "em breve").
async function loadPropostas(): Promise<Proposal[]> {
  try {
    return await prisma.proposal.findMany({
      orderBy: { createdAt: "asc" },
      take: 4,
    });
  } catch (error) {
    console.error("Falha ao carregar propostas na home.", error);
    return [];
  }
}

export default async function Home() {
  const [propostas, content] = await Promise.all([
    loadPropostas(),
    getSiteContent(),
  ]);
  const { why, home } = content;

  return (
    <>
      <HomeFx />
      <section className="hero" id="hero">
        {/* Mapa do Brasil com Mato Grosso destacado (marca d'água) — SVG decorativo
            posicionado via CSS. Base do mapa: @svg-maps/brazil (VictorCazanave), CC BY 4.0.
            next/image não otimiza SVG e o dimensionamento vem do CSS .hero-map */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hero-map" id="heroMap" src="/brazil-mt.svg" alt="" aria-hidden="true" />

        {/* Bandeira de Mato Grosso — marca-d'água atrás do candidato (lado esquerdo) */}
        <div className="hero-flag" aria-hidden="true"></div>

        {/* Foto do Casarin (recorte, fundo transparente) */}
        <div className="hero-bg" id="heroBg"></div>

        {/* Texturas halftone */}
        <div className="ht ht-tl"></div>
        <div className="ht ht-bc"></div>

        {/* Varredura de scanner */}
        <div className="hero-scan"></div>

        {/* HUD tático (decorativo — oculto para leitores de tela) */}
        <span className="hud-cross hc1" aria-hidden="true">+</span>
        <span className="hud-cross hc2" aria-hidden="true">+</span>
        <span className="hud-cross hc3" aria-hidden="true">+</span>

        {/* Conteúdo */}
        <div className="hero-content container">
          <div className="hero-inner">
            <div className="hero-eyebrow sl">{home.heroEyebrow}</div>
            <h1 className="hero-name" id="heroName" aria-label={home.heroName}>
              <em>{home.heroName}</em>
            </h1>
            <div className="hero-sub sl d2">
              {home.heroSubtitle.split("\n").map((line, i, arr) => (
                <Fragment key={i}>
                  {line}
                  {i < arr.length - 1 ? <br /> : null}
                </Fragment>
              ))}
            </div>
            <p className="hero-lead sl d3">{home.heroLead}</p>
            <div className="hero-actions sl d4">
              <a href="https://apoiar.me/sargentocasarin" target="_blank" rel="noopener noreferrer" className="btn btn-help"><span aria-hidden="true">💲</span> Quero ajudar</a>
              <a href="https://wpgrupos.spx.ia.br/entrar" target="_blank" rel="noopener noreferrer" className="btn btn-gold"><span aria-hidden="true">💪</span> Quero Apoiar</a>
            </div>
            <div className="ribbons">
              <span className="ribbon ribbon-green">{home.ribbon1}</span>
              <span className="ribbon ribbon-beige">{home.ribbon2}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="tact-divider"></div>

      {/* CREDENCIAIS */}
      <div className="cred-strip">
        <div className="ht"></div>
        <div className="cred-strip-inner">
          {home.creds.map((c, i) => (
            <div className={`cred-item fi${i > 0 ? ` d${i}` : ""}`} key={i}>
              <span className="cred-num">{c.num}</span>
              <div className="cred-txt">
                <strong>{c.title}</strong>
                <span>{c.text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* COMENDA — faixa de destaque da condecoração */}
      <aside className="comenda-band" aria-label="Condecoração">
        <div className="container comenda-band-inner">
          <span className="comenda-medal" aria-hidden="true">
            <svg viewBox="0 0 48 48" fill="none">
              <path d="M16 3 L22 19" stroke="#0d3b66" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M32 3 L26 19" stroke="#00b84b" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="24" cy="31" r="13" fill="#ffd500" stroke="#0d3b66" strokeWidth="2" />
              <text x="24" y="36.5" textAnchor="middle" fontSize="16" fontWeight="700" fill="#0d3b66">★</text>
            </svg>
          </span>
          <div className="comenda-band-text">
            <span className="comenda-band-eyebrow">{home.comendaEyebrow}</span>
            <p className="comenda-band-title">{home.comendaTitle}</p>
            <span className="comenda-band-meta">{home.comendaMeta}</span>
          </div>
        </div>
      </aside>

      {/* POR QUE ENTRAR PARA A POLÍTICA */}
      <section className="why section">
        <div className="ht ht-dark"></div>
        <div className="container">
          <p className="why-caption">{why.caption}</p>
          <div className="why-wrap">
            <div className="why-left">
              <div className="eyebrow eyebrow-dark sl" style={{ marginBottom: '1.25rem' }}>{why.eyebrow}</div>
              <h2 className="why-title sl d1">
                POR<br />QUE<br />
                <em>ENTRAR</em><br />
                PARA A<br />POLÍTICA?
              </h2>
              {why.paragraphs.map((p, i) => (
                <p key={i} className={`why-lead fi d${Math.min(i + 2, 4)}`}>
                  {renderRich(p)}
                </p>
              ))}
              <Link href="/sobre" className="btn btn-outline fi d4" style={{ marginTop: '1.75rem' }}>Conheça a trajetória <span aria-hidden="true">➔</span></Link>
            </div>

            <div className="why-right" id="whyRight">
              <div className="why-photo" style={{ backgroundImage: 'url(/casarin-why.jpeg)' }}></div>
              <div className="why-scan"></div>
              {why.targets.slice(0, 5).map((t, i) => (
                <div key={i} className={`tgt t${i + 1}`}>
                  <span className="lead"></span>
                  <span className="rec"></span>
                  <span className="lbl">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROPOSTAS */}
      <section className="propostas section">
        <div className="topo-bg topo-soft"></div>
        <div className="container">
          <div className="propostas-head">
            <div className="eyebrow fi">{home.propostasEyebrow}</div>
            <h2 className="d-md fi d1" style={{ color: 'var(--GX)', marginTop: '.75rem' }}>
              {home.propostasTitle1}<br /><em style={{ fontStyle: 'normal', color: 'var(--B)' }}>{home.propostasTitle2}</em>
            </h2>
          </div>
          {propostas.length === 0 ? (
            <p className="fi" style={{ color: 'rgba(26,26,26,.62)' }}>
              As propostas detalhadas serão publicadas em breve.
            </p>
          ) : (
            <div className="propostas-grid">
              {propostas.map((p, i) => (
                <div className={`prop-card fi ${i > 0 ? `d${i}` : ''}`} key={p.id}>
                  <div className="prop-icon" aria-hidden="true">
                    {p.slug === 'seguranca-publica' ? '🛡️'
                      : p.slug === 'valorizacao-dos-profissionais' ? '🎖️'
                      : p.slug === 'educacao-e-valores' ? '📚'
                      : p.slug === 'mato-grosso-forte' ? '🌾'
                      : '📌'}
                  </div>
                  <h3>{p.title}</h3>
                  <p>{p.description}</p>
                  <Link href={`/propostas/${p.slug}`} className="prop-link">Ver proposta <span aria-hidden="true">➔</span></Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="tact-divider"></div>

      {/* MARQUEE (decorativo: os itens são duplicados p/ o loop infinito, então
          aria-hidden evita o leitor de tela repetir tudo 2x) */}
      <div className="marquee-strip" aria-hidden="true">
        <div className="marquee-track">
          {[...home.marquee, ...home.marquee].map((item, i) => (
            <div className="marquee-item" key={i}>
              {item} <span className="marquee-sep">✦</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA TROPA */}
      <section className="cta-tropa">
        <div className="topo-bg"></div>
        <div className="ht"></div>
        <div className="container">
          <div className="eyebrow fi" style={{ justifyContent: 'center', display: 'flex', marginBottom: '1.25rem' }}>{home.ctaEyebrow}</div>
          <h2 className="d-lg fi d1">{home.ctaTitle1}<br /><em>{home.ctaTitle2}</em></h2>
          <p className="cta-lead fi d2">{home.ctaLead}</p>
          <a href="https://wpgrupos.spx.ia.br/entrar" target="_blank" rel="noopener noreferrer" className="btn btn-gold fi d3">Nossos Grupos <span aria-hidden="true">➔</span></a>
        </div>
      </section>
    </>
  );
}
