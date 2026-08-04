import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Quero Ajudar",
  description: "Formas de apoiar a pré-campanha do Sargento Dickson Casarin em Mato Grosso.",
};

export default function AjudarPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow sl">Apoie a missão</div>
          <h1 className="sl d1">
            QUERO <em>AJUDAR</em>
          </h1>
          <p className="fi d2">
            Esta é uma caminhada construída por gente comum, que acredita que Mato Grosso
            pode ser mais seguro. Todo apoio conta.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: "3.5rem" }}>
        <div className="container">
          <div className="legal-alert fi">
            <span className="legal-alert-icon">⚖️</span>
            <p>
              Estamos em fase de <strong>pré-campanha</strong>. Doações financeiras seguem as
              regras da legislação eleitoral e só serão recebidas pela plataforma oficial,
              que será divulgada aqui no período permitido. Desconfie de qualquer pedido de
              dinheiro em nome do Sargento Casarin fora dos canais oficiais.
            </p>
          </div>

          <div className="contact-grid">
            <div className="contact-card fi">
              <div className="contact-icon">📣</div>
              <h3>Divulgue</h3>
              <p>
                Compartilhe as propostas com amigos e familiares. Boca a boca é a arma mais
                poderosa de uma campanha independente.
              </p>
            </div>
            <div className="contact-card fi d1">
              <div className="contact-icon">🤝</div>
              <h3>Seja voluntário</h3>
              <p>
                Entre para a Tropa e participe das mobilizações na sua cidade ou região.
              </p>
            </div>
            <div className="contact-card fi d2">
              <div className="contact-icon">💡</div>
              <h3>Envie ideias</h3>
              <p>
                Conte os problemas da sua região e ajude a construir propostas que funcionam
                na vida real.
              </p>
            </div>
          </div>

          <div className="mt-bloco" style={{ marginTop: "3rem" }}>
            <h2>Comece agora</h2>
            <p>O primeiro passo é entrar para a rede de apoiadores.</p>
            <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
              <Link href="/tropa" className="btn btn-gold">
                Entre para a Tropa ➔
              </Link>
              <Link href="/contato" className="btn btn-ghost">
                Falar com a equipe
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
