import { ChevronUp } from "lucide-react";

export default function Home() {
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
              <a href="/ajudar" target="_blank" rel="noopener noreferrer" className="btn btn-help">💪 Quero ajudar</a>
              <a href="/tropa" className="btn btn-gold">Entre para a Tropa ➔</a>
              <a href="/sobre" className="btn btn-ghost">Quem é Casarin</a>
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
    </>
  );
}
