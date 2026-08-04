import Link from "next/link";
import { ChevronUp } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const marqueeItems = [
  "SARGENTO CASARIN",
  "SEGURANÇA PÚBLICA",
  "DEPUTADO ESTADUAL",
  "MATO GROSSO 2026",
  "NINGUÉM AGUENTA MAIS",
];

export default async function Home() {
  const propostas = await prisma.proposal.findMany({
    orderBy: { createdAt: "asc" },
    take: 4,
  });

  return (
    <>
      <section className="hero" id="hero">
        {/* Textura de mapa militar */}
        <div className="topo-bg" style={{ opacity: 0.4, WebkitMaskImage: 'none', maskImage: 'none' }}></div>

        {/* Mapa do Brasil (marca d'água) */}
        <img className="hero-map" id="heroMap" src="/brazil-map.svg" alt="" aria-hidden="true" />

        {/* Foto do Casarin */}
        <div className="hero-bg" id="heroBg" style={{ backgroundImage: 'url(/DSCF3339.JPG.jpeg)' }}></div>

        {/* Texturas halftone */}
        <div className="ht ht-tl"></div>
        <div className="ht ht-bc"></div>

        {/* Varredura de scanner */}
        <div className="hero-scan"></div>

        {/* HUD tático */}
        <div className="hud hud-tl">MT · BRASIL</div>
        <div className="hud hud-tr" id="hudType"></div>
        <div className="hud hud-bl">OP. 2026 – ATIVO</div>
        <span className="hud-cross hc1">+</span>
        <span className="hud-cross hc2">+</span>
        <span className="hud-cross hc3">+</span>
        <span className="corner corner-tl"></span>
        <span className="corner corner-tr"></span>
        <span className="corner corner-bl"></span>
        <span className="corner corner-br"></span>

        {/* Conteúdo */}
        <div className="hero-content container">
          <div className="hero-inner">
            <div className="hero-eyebrow sl">Sargento</div>
            <h1 className="hero-name" id="heroName">
              <span>DICKSON</span>
              <em className="flex items-center">
                C
                <span className="sgt-a">
                  <ChevronUp strokeWidth={4} className="sgt-chevron" />
                  <ChevronUp strokeWidth={4} className="sgt-chevron" />
                  <ChevronUp strokeWidth={4} className="sgt-chevron" />
                </span>
                SARIN
              </em>
            </h1>
            <div className="hero-sub sl d2">Pré-candidato a Deputado Estadual<br/>por Mato Grosso</div>
            <p className="hero-lead sl d3">
              15 anos na linha de frente da segurança pública. Agora, a missão é levar essa experiência para onde as decisões são tomadas.
            </p>
            <div className="hero-actions sl d4">
              <Link href="/ajudar" className="btn btn-help">💪 Quero ajudar</Link>
              <Link href="/tropa" className="btn btn-gold">Entre para a Tropa ➔</Link>
              <Link href="/sobre" className="btn btn-ghost">Quem é Casarin</Link>
            </div>
            <div className="ribbons">
              <span className="ribbon ribbon-green">NINGUÉM</span>
              <span className="ribbon ribbon-beige">AGUENTA MAIS!</span>
            </div>
          </div>
        </div>
      </section>

      <div className="tact-divider"></div>

      {/* CREDENCIAIS */}
      <div className="cred-strip">
        <div className="ht"></div>
        <div className="cred-strip-inner">
          <div className="cred-item fi">
            <span className="cred-num">15</span>
            <div className="cred-txt">
              <strong>Anos na linha de frente</strong>
              <span>Segurança Pública em MT. Experiência real – não teoria.</span>
            </div>
          </div>
          <div className="cred-item fi d1">
            <span className="cred-num">ROTAM</span>
            <div className="cred-txt">
              <strong>Tropa de Elite</strong>
              <span>Formação tática e linha de frente em missões complexas.</span>
            </div>
          </div>
          <div className="cred-item fi d2">
            <span className="cred-num">MT</span>
            <div className="cred-txt">
              <strong>Mato Grosso primeiro</strong>
              <span>Defende quem vive, trabalha e produz neste estado.</span>
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-bar">
        <div className="stats-inner">
          <div className="stat fi">
            <span className="stat-n" data-target="15">0</span>
            <span className="stat-l">Anos de farda</span>
          </div>
          <div className="stat fi d1">
            <span className="stat-n" data-target="141">0</span>
            <span className="stat-l">Municípios em MT</span>
          </div>
        </div>
      </div>

      {/* PROPOSTAS */}
      <section className="propostas section">
        <div className="topo-bg topo-soft"></div>
        <div className="container">
          <div className="propostas-head">
            <div className="eyebrow fi">Eixos de atuação</div>
            <h2 className="d-md fi d1" style={{ color: 'var(--W)', marginTop: '.75rem' }}>
              O QUE CASARIN<br /><em style={{ fontStyle: 'normal', color: 'var(--B)' }}>VAI DEFENDER</em>
            </h2>
          </div>
          <div className="propostas-grid">
            {propostas.map((p, i) => (
              <div className={`prop-card fi ${i > 0 ? `d${i}` : ''}`} key={p.id}>
                <div className="prop-icon">
                  {p.slug === 'seguranca-publica' && '🛡️'}
                  {p.slug === 'valorizacao-dos-profissionais' && '🎖️'}
                  {p.slug === 'educacao-e-valores' && '📚'}
                  {p.slug === 'mato-grosso-forte' && '🌾'}
                </div>
                <h3>{p.title}</h3>
                <p>{p.description}</p>
                <Link href={`/propostas/${p.slug}`} className="prop-link">Ver proposta ➔</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="tact-divider"></div>

      {/* MARQUEE */}
      <div className="marquee-strip">
        <div className="marquee-track">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
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
          <div className="eyebrow fi" style={{ justifyContent: 'center', display: 'flex', marginBottom: '1.25rem' }}>Comunidade</div>
          <h2 className="d-lg fi d1">FAÇA PARTE<br />DA <em>TROPA</em></h2>
          <p className="cta-lead fi d2">Receba conteúdos exclusivos, participe das mobilizações e ajude a levar essa mensagem por todo o Mato Grosso.</p>
          <Link href="/tropa" className="btn btn-gold fi d3">Quero entrar para a Tropa ➔</Link>
        </div>
      </section>
    </>
  );
}
