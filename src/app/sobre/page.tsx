import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Quem é o Casarin",
  description:
    "Conheça a trajetória do Sargento Dickson Casarin: 15 anos na linha de frente da segurança pública de Mato Grosso, condecorado com a Comenda Marechal Cândido Rondon pela Assembleia Legislativa de MT.",
};

const timeline = [
  {
    label: "01",
    title: "Ingresso na Polícia Militar de Mato Grosso",
    text: "Escolheu servir. Desde o primeiro dia de farda, o compromisso foi com a proteção das famílias mato-grossenses.",
  },
  {
    label: "02",
    title: "Linha de frente",
    text: "Anos de policiamento ostensivo nas ruas, vivendo de perto a realidade da segurança pública — a que não aparece nos gabinetes.",
  },
  {
    label: "03",
    title: "ROTAM — Batalhão Especializado de Patrulhamento Tático",
    text: "Formado em um dos melhores batalhões de Patrulhamento Tático do Brasil, atuando em ocorrências complexas de alto risco.",
  },
  {
    label: "04",
    title: "Candidatura 2026",
    text: "A nova missão: levar a experiência da linha de frente para onde as decisões são tomadas, como Deputado Estadual por Mato Grosso.",
  },
];

export default function SobrePage() {
  return (
    <>
      <section className="page-hero page-hero--map">
        {/* Mapa do Brasil com Mato Grosso destacado (decorativo) — ocupa o lugar
            do anel do page-hero. Base: @svg-maps/brazil (CC BY 4.0). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="page-hero-map" src="/brazil-mt.svg" alt="" aria-hidden="true" />
        <div className="container">
          <div className="eyebrow sl">Trajetória</div>
          <h1 className="sl d1">
            QUEM É O <em>CASARIN</em>
          </h1>
          <p className="fi d2">
            15 anos de farda e de linha de frente na segurança pública de Mato Grosso.
            Experiência real — não teoria.
          </p>
        </div>
      </section>

      <section className="bio-section section">
        <div className="container">
          <div className="bio-grid">
            <div className="bio-sticky">
              <div className="bio-photo fi">
                <Image
                  src="/casarin-retrato.jpeg"
                  alt="Sargento Dickson Casarin"
                  width={1067}
                  height={1600}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  preload
                />
              </div>
            </div>
            <div className="bio-text">
              <div className="eyebrow eyebrow-dark fi">Sargento Dickson Casarin</div>
              <h2 className="fi d1">Uma vida dedicada a proteger Mato Grosso</h2>
              <p className="fi d2">
                Dickson Casarin é Sargento da Polícia Militar de Mato Grosso, com 15 anos de
                serviço dedicados à segurança da população. Da ronda nas ruas às operações da
                ROTAM, construiu sua trajetória onde o problema acontece: na linha de frente.
              </p>
              <p className="fi d2">
                Filho de Sinop, fez da rua o seu posto no 26º Batalhão de Polícia Militar, em
                Nova Mutum: enfrentou o crime de frente, desarticulou quadrilhas, tirou armas de
                circulação e combateu o tráfico. Convicto de que protege melhor quem mais se
                prepara, uniu a experiência das ruas ao estudo.
              </p>
              <div className="bio-quote fi d3">
                <p>
                  “Quem passou a vida enfrentando o crime de perto sabe exatamente o que
                  precisa mudar nas leis e no orçamento para proteger as famílias.”
                </p>
              </div>
              <p className="fi d3">
                Depois de anos vendo boas operações esbarrarem em falta de estrutura, leis
                frouxas e decisões tomadas longe da realidade, o Sargento Casarin decidiu dar
                o próximo passo: representar os mato-grossenses na Assembleia Legislativa,
                com a firmeza de quem conhece o problema e a responsabilidade de quem sempre
                serviu.
              </p>

              <div className="timeline">
                {timeline.map((item) => (
                  <div className="tl-item fi" key={item.label}>
                    <div className="tl-dot">{item.label}</div>
                    <div className="tl-body">
                      <h3>{item.title}</h3>
                      <p>{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comenda Marechal Cândido Rondon — destaque da premiação */}
              <div className="honor-card fi">
                <span className="honor-medal" aria-hidden="true">
                  <svg viewBox="0 0 48 48" fill="none">
                    <path d="M16 3 L22 19" stroke="#0d3b66" strokeWidth="3.5" strokeLinecap="round" />
                    <path d="M32 3 L26 19" stroke="#00b84b" strokeWidth="3.5" strokeLinecap="round" />
                    <circle cx="24" cy="31" r="13" fill="#ffd500" stroke="#0d3b66" strokeWidth="2" />
                    <text x="24" y="36.5" textAnchor="middle" fontSize="16" fontWeight="700" fill="#0d3b66">★</text>
                  </svg>
                </span>
                <div className="honor-body">
                  <span className="honor-eyebrow">Honraria · 2026</span>
                  <h3 className="honor-title">Comenda Marechal Cândido Rondon</h3>
                  <p className="honor-desc">
                    A mais alta honraria da Assembleia Legislativa de Mato Grosso a quem presta
                    relevantes serviços ao Estado. Concedida ao Sargento Casarin pela sua
                    trajetória de dedicação à segurança pública mato-grossense.
                  </p>
                  <span className="honor-meta">
                    Assembleia Legislativa de MT · Projeto de Resolução nº 435/2026
                  </span>
                </div>
              </div>

              {/* Formação, especializações e honrarias */}
              <div className="creds fi">
                <h3 className="creds-title">Formação &amp; Reconhecimentos</h3>
                <div className="creds-grid">
                  <div className="creds-col">
                    <h4>Formação</h4>
                    <ul>
                      <li>Bacharel em Direito · Faculdade Fasip (2020)</li>
                      <li>Tecnólogo em Gestão Pública · Anhanguera (2018)</li>
                      <li>Curso de Formação de Soldados · PMMT (2011)</li>
                    </ul>
                  </div>
                  <div className="creds-col">
                    <h4>Especializações</h4>
                    <ul>
                      <li>Curso de Capacitação da ROTAM (2014)</li>
                      <li>Inteligência de Segurança Pública (2017)</li>
                      <li>Atendimento Pré-hospitalar (2015)</li>
                    </ul>
                  </div>
                  <div className="creds-col">
                    <h4>Honrarias</h4>
                    <ul>
                      <li>Comenda Marechal Cândido Rondon · ALMT (2026)</li>
                      <li>Moção de Aplausos · Câmara de Lucas do Rio Verde (2013)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Link href="/propostas" className="btn btn-outline fi" style={{ marginTop: "1.5rem" }}>
                Conheça as propostas <span aria-hidden="true">➔</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
