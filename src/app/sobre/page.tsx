import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getSiteContent, renderRich } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Quem é o Casarin",
  description:
    "Conheça a trajetória do Sargento Dickson Casarin: 15 anos na linha de frente da segurança pública de Mato Grosso, condecorado com a Comenda Marechal Cândido Rondon pela Assembleia Legislativa de MT.",
};

// Reflete imediatamente as edições feitas em /admin/conteudo.
export const dynamic = "force-dynamic";

export default async function SobrePage() {
  const { bio, trajetoria, comenda, creds } = await getSiteContent();

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
              <div className="eyebrow eyebrow-dark fi">{bio.eyebrow}</div>
              <h2 className="fi d1">{bio.title}</h2>
              {bio.paragraphs.map((p, i) => (
                <p className="fi d2" key={i}>
                  {renderRich(p)}
                </p>
              ))}
              <div className="bio-quote fi d3">
                <p>“{bio.quote}”</p>
              </div>
              <p className="fi d3">{renderRich(bio.closing)}</p>

              <div className="timeline">
                {trajetoria.steps.map((item, i) => (
                  <div className="tl-item fi" key={i}>
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
                  <span className="honor-eyebrow">{comenda.eyebrow}</span>
                  <h3 className="honor-title">{comenda.title}</h3>
                  <p className="honor-desc">{comenda.desc}</p>
                  <span className="honor-meta">{comenda.meta}</span>
                </div>
              </div>

              {/* Formação, especializações e honrarias */}
              <div className="creds fi">
                <h3 className="creds-title">Formação &amp; Reconhecimentos</h3>
                <div className="creds-grid">
                  <div className="creds-col">
                    <h4>Formação</h4>
                    <ul>
                      {creds.formacao.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="creds-col">
                    <h4>Especializações</h4>
                    <ul>
                      {creds.especializacoes.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="creds-col">
                    <h4>Honrarias</h4>
                    <ul>
                      {creds.honrarias.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
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
