import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Manifesto",
  description:
    "O manifesto do Sargento Dickson Casarin: por que a linha de frente precisa chegar à Assembleia Legislativa de Mato Grosso.",
};

export default function ManifestoPage() {
  return (
    <section className="manifesto-hero">
      <div
        className="manifesto-bg"
        style={{ backgroundImage: "url(/casarin-retrato.jpeg)" }}
      ></div>
      <div className="container">
        <div className="manifesto-content">
          <div className="eyebrow sl">Manifesto</div>
          <h1 className="sl d1">
            NINGUÉM
            <br />
            <em>AGUENTA</em>
            <br />
            MAIS
          </h1>
          <div className="manifesto-hr"></div>
          <div className="manifesto-p">
            <p className="fi">
              Ninguém aguenta mais viver com medo. Medo de sair de casa, medo de deixar os
              filhos na escola, medo de trabalhar e perder tudo o que construiu com esforço.
            </p>
            <p className="fi d1">
              Enquanto isso, muitas das decisões que definem a segurança das nossas famílias
              são tomadas longe das ruas — por quem nunca sentiu na pele o que é enfrentar o
              crime de frente.
            </p>
            <p className="fi d2">
              Eu passei 15 anos na linha de frente da segurança pública de Mato Grosso.
              Aprendi que coragem sem estrutura não basta, e que lei frouxa desfaz o
              trabalho de quem arrisca a vida para proteger a sociedade.
            </p>
            <p className="fi d3">
              Por isso aceitei uma nova missão: levar a voz da linha de frente — e a voz de
              quem vive, trabalha e produz neste estado — para dentro da Assembleia
              Legislativa. Com disciplina, técnica e respeito por cada família
              mato-grossense.
            </p>
          </div>

          <div className="manifesto-stats">
            <div className="m-stat fi">
              <strong>15</strong>
              <span>Anos de farda</span>
            </div>
            <div className="m-stat fi d1">
              <strong>142</strong>
              <span>Municípios em MT</span>
            </div>
            <div className="m-stat fi d2">
              <strong>2027</strong>
              <span>A missão continua</span>
            </div>
          </div>

          <div className="fi d3" style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
            <Link href="/tropa" className="btn btn-gold">
              Nossos Grupos ➔
            </Link>
            <Link href="/propostas" className="btn btn-ghost">
              Ver as propostas
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
