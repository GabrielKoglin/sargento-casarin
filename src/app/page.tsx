import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { HomeFx } from "@/components/home-fx";

export const dynamic = "force-dynamic";

const marqueeItems = [
  "SARGENTO CASARIN",
  "SEGURANÇA PÚBLICA",
  "DEPUTADO ESTADUAL",
  "MATO GROSSO 2026",
  "VAMOS VENCER",
];

export default async function Home() {
  const propostas = await prisma.proposal.findMany({
    orderBy: { createdAt: "asc" },
    take: 4,
  });

  return (
    <>
      <HomeFx />
      <section className="hero" id="hero">
        {/* Mapa do Brasil com Mato Grosso destacado (marca d'água) — SVG decorativo
            posicionado via CSS. Base do mapa: @svg-maps/brazil (VictorCazanave), CC BY 4.0.
            next/image não otimiza SVG e o dimensionamento vem do CSS .hero-map */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hero-map" id="heroMap" src="/brazil-mt.svg" alt="" aria-hidden="true" />

        {/* Foto do Casarin */}
        <div className="hero-bg" id="heroBg" style={{ backgroundImage: 'url(/DSCF3339.JPG.jpeg)' }}></div>

        {/* Texturas halftone */}
        <div className="ht ht-tl"></div>
        <div className="ht ht-bc"></div>

        {/* Varredura de scanner */}
        <div className="hero-scan"></div>

        {/* HUD tático (decorativo — oculto para leitores de tela) */}
        <div className="hud hud-tl" aria-hidden="true">MT · BRASIL</div>
        <div className="hud hud-tr" id="hudType" aria-hidden="true"></div>
        <div className="hud hud-bl" aria-hidden="true">OP. 2026 – ATIVO</div>
        <span className="hud-cross hc1" aria-hidden="true">+</span>
        <span className="hud-cross hc2" aria-hidden="true">+</span>
        <span className="hud-cross hc3" aria-hidden="true">+</span>
        <span className="corner corner-tl" aria-hidden="true"></span>
        <span className="corner corner-tr" aria-hidden="true"></span>
        <span className="corner corner-bl" aria-hidden="true"></span>
        <span className="corner corner-br" aria-hidden="true"></span>

        {/* Conteúdo */}
        <div className="hero-content container">
          <div className="hero-inner">
            <div className="hero-eyebrow sl">Sargento</div>
            <h1 className="hero-name" id="heroName" aria-label="Dickson Casarin">
              <span>DICKSON</span>
              <em>
                C
                <i className="sgt-badge" aria-hidden="true">
                  <svg viewBox="0 0 100 100" focusable="false">
                    {/* 3 divisas (chevrons) de sargento */}
                    <path d="M14 50 L50 16 L86 50" fill="none" stroke="#ffd500" strokeWidth={13} strokeLinejoin="miter" />
                    <path d="M14 71 L50 37 L86 71" fill="none" stroke="#ffd500" strokeWidth={13} strokeLinejoin="miter" />
                    <path d="M14 92 L50 58 L86 92" fill="none" stroke="#ffd500" strokeWidth={13} strokeLinejoin="miter" />
                  </svg>
                </i>
                SARIN
              </em>
            </h1>
            <div className="hero-sub sl d2">Pré-candidato a Deputado Estadual<br/>por Mato Grosso</div>
            <p className="hero-lead sl d3">
              15 anos na linha de frente da segurança pública. Agora, a missão é levar essa experiência para onde as decisões são tomadas.
            </p>
            <div className="hero-actions sl d4">
              <Link href="/ajudar" className="btn btn-help"><span aria-hidden="true">💪</span> Quero ajudar</Link>
              <Link href="/tropa" className="btn btn-gold">Entre para a Tropa <span aria-hidden="true">➔</span></Link>
              <Link href="/sobre" className="btn btn-ghost">Quem é o Casarin</Link>
            </div>
            <div className="ribbons">
              <span className="ribbon ribbon-green">VAMOS</span>
              <span className="ribbon ribbon-beige">VENCER!</span>
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

      {/* POR QUE ENTRAR PARA A POLÍTICA */}
      <section className="why section">
        <div className="ht ht-dark"></div>
        <div className="container">
          <p className="why-caption">
            Casarin não quer ser mais um político — ele representa quem enfrenta a realidade das ruas todos os dias
          </p>
          <div className="why-wrap">
            <div className="why-left">
              <div className="eyebrow eyebrow-dark sl" style={{ marginBottom: '1.25rem' }}>Por que entrar para a política?</div>
              <h2 className="why-title sl d1">
                POR<br />QUE<br />
                <em>ENTRAR</em><br />
                PARA A<br />POLÍTICA?
              </h2>
              <p className="why-lead fi d2">
                São <strong>15 anos na linha de frente da segurança pública de Mato Grosso</strong>, incluindo a ROTAM, tropa de elite da Polícia Militar. Nesse tempo, o Sargento Casarin aprendeu uma lição dura: a coragem prende o criminoso, mas <strong>é a lei que decide se ele fica preso.</strong>
              </p>
              <p className="why-lead fi d3">
                As decisões que definem a segurança das famílias mato-grossenses são tomadas longe das ruas — na Assembleia Legislativa, nas leis e no orçamento. E, na maioria das vezes, por quem nunca vestiu uma farda.
              </p>
              <p className="why-lead fi d4">
                Por isso o sargento decidiu avançar: levar a experiência de quem conhece o problema de perto para onde as decisões são tomadas.
              </p>
              <Link href="/sobre" className="btn btn-outline fi d4" style={{ marginTop: '1.75rem' }}>Conheça a trajetória <span aria-hidden="true">➔</span></Link>
            </div>

            <div className="why-right" id="whyRight">
              <div className="why-photo" style={{ backgroundImage: 'url(/DSCF3339.JPG.jpeg)' }}></div>
              <div className="why-scan"></div>
              <div className="tgt t1"><span className="lead"></span><span className="rec"></span><span className="lbl">Quem conhece a rua, não só o gabinete</span></div>
              <div className="tgt t2"><span className="lead"></span><span className="rec"></span><span className="lbl">15 anos de farda na linha de frente</span></div>
              <div className="tgt t3"><span className="lead"></span><span className="rec"></span><span className="lbl">Defesa das famílias mato-grossenses</span></div>
              <div className="tgt t4"><span className="lead"></span><span className="rec"></span><span className="lbl">Respeito a quem veste a farda</span></div>
              <div className="tgt t5"><span className="lead"></span><span className="rec"></span><span className="lbl">Disciplina de tropa de elite na Assembleia</span></div>
            </div>
          </div>
        </div>
      </section>

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
          {propostas.length === 0 ? (
            <p className="fi" style={{ color: 'rgba(255,255,255,.62)' }}>
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
          <Link href="/tropa" className="btn btn-gold fi d3">Quero entrar para a Tropa <span aria-hidden="true">➔</span></Link>
        </div>
      </section>
    </>
  );
}
