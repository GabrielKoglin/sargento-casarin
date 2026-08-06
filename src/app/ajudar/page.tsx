import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Quero Ajudar",
  description: "Formas de apoiar a campanha do Sargento Dickson Casarin em Mato Grosso.",
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
            <span className="legal-alert-icon" aria-hidden="true">⚖️</span>
            <p>
              O apoio financeiro é feito exclusivamente pela plataforma oficial
              (<strong>apoiar.me/sargentocasarin</strong>), sempre de acordo com as regras
              da legislação eleitoral. Desconfie de qualquer pedido de dinheiro em nome do
              Sargento Casarin fora desse canal.
            </p>
          </div>

          <div className="contact-grid">
            <div className="contact-card fi">
              <div className="contact-icon" aria-hidden="true">📣</div>
              <h2>Divulgue</h2>
              <p>
                Compartilhe as propostas com amigos e familiares. Boca a boca é a arma mais
                poderosa de uma campanha independente.
              </p>
            </div>
            <div className="contact-card fi d1">
              <div className="contact-icon" aria-hidden="true">🤝</div>
              <h2>Seja voluntário</h2>
              <p>
                Entre nos nossos grupos e participe das mobilizações na sua cidade ou região.
              </p>
            </div>
            <div className="contact-card fi d2">
              <div className="contact-icon" aria-hidden="true">💡</div>
              <h2>Envie ideias</h2>
              <p>
                Conte os problemas da sua região e ajude a construir propostas que funcionam
                na vida real.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="support">
        <div className="topo-bg"></div>
        <div className="container">
          <div className="support-inner">
            <div className="eyebrow fi">Apoio à campanha</div>
            <h2 className="support-title fi d1">
              FORTALEÇA
              <br />
              ESSA <em>MISSÃO</em>
            </h2>
            <p className="support-lead fi d2">
              Esta é uma caminhada <strong>independente</strong>, sem máquina política,
              construída por gente comum que acredita que Mato Grosso pode ser mais seguro.
              Cada reforço, dentro das regras da legislação eleitoral, ajuda a manter essa
              missão de pé.
            </p>
            <div className="support-amounts fi d2">
              <div className="amount-chip">
                R$ 30 <span>exemplo</span>
              </div>
              <div className="amount-chip">
                R$ 50 <span>exemplo</span>
              </div>
              <div className="amount-chip">
                R$ 100 <span>exemplo</span>
              </div>
              <div className="amount-chip">
                R$ 200 <span>exemplo</span>
              </div>
            </div>
            <a
              href="https://apoiar.me/sargentocasarin"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-donate fi d3"
            >
              Quero apoiar <span aria-hidden="true">➔</span>
            </a>
            <div className="support-trust fi d3">
              Valores meramente ilustrativos · O apoio é feito pela{" "}
              <strong>plataforma oficial apoiar.me/sargentocasarin</strong>, conforme a
              legislação eleitoral.
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="mt-bloco">
            <h2>Comece agora</h2>
            <p>O primeiro passo é entrar para a rede de apoiadores.</p>
            <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
              <Link href="/tropa" className="btn btn-gold">
                Nossos Grupos <span aria-hidden="true">➔</span>
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
