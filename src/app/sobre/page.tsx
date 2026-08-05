import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Quem é o Casarin",
  description:
    "Conheça a trajetória do Sargento Dickson Casarin: 15 anos na linha de frente da segurança pública de Mato Grosso.",
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
    title: "ROTAM — Tropa de Elite",
    text: "Formação tática e atuação nas missões mais complexas da Polícia Militar, com disciplina, técnica e coragem.",
  },
  {
    label: "04",
    title: "Pré-candidatura 2026",
    text: "A nova missão: levar a experiência da linha de frente para onde as decisões são tomadas, como Deputado Estadual por Mato Grosso.",
  },
];

export default function SobrePage() {
  return (
    <>
      <section className="page-hero">
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
                <img src="/DSCF3339.JPG.jpeg" alt="Sargento Dickson Casarin" />
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

              <Link href="/propostas" className="btn btn-outline fi" style={{ marginTop: "1.5rem" }}>
                Conheça as propostas ➔
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
