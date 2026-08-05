import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale com a equipe do Sargento Dickson Casarin.",
};

export default function ContatoPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow sl">Canal direto</div>
          <h1 className="sl d1">
            FALE COM A <em>EQUIPE</em>
          </h1>
          <p className="fi d2">
            Dúvidas, sugestões de propostas ou convites para eventos: cada mensagem é lida
            pela equipe da pré-campanha.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: "3rem" }}>
        <div className="container">
          <div className="contact-grid">
            <div className="contact-card fi">
              <div className="contact-icon" aria-hidden="true">📍</div>
              <h2>Base</h2>
              <p>Cuiabá, Mato Grosso — Brasil</p>
            </div>
            <div className="contact-card fi d1">
              <div className="contact-icon" aria-hidden="true">✉️</div>
              <h2>E-mail</h2>
              {/* Placeholder — trocar pelo e-mail oficial */}
              <a href="mailto:contato@sargentocasarin.com.br">contato@sargentocasarin.com.br</a>
            </div>
            <div className="contact-card fi d2">
              <div className="contact-icon" aria-hidden="true">💬</div>
              <h2>WhatsApp</h2>
              <p>Em breve — os canais oficiais serão divulgados aqui</p>
            </div>
          </div>
        </div>
      </section>

      <div className="form-wrap">
        <div className="container">
          <div className="form-box">
            <h2>Envie sua mensagem</h2>
            <p>Responderemos pelo e-mail ou WhatsApp informado.</p>
            <ContactForm
              origin="contato"
              withMessage
              submitLabel="Enviar mensagem ➔"
              successTitle="Mensagem recebida!"
              successText="Obrigado pelo contato. A equipe responderá o mais rápido possível."
            />
          </div>
        </div>
      </div>
    </>
  );
}
