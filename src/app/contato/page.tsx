import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { getSiteContent, renderHeading } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale com a equipe do Sargento Dickson Casarin.",
};

export const dynamic = "force-dynamic";

export default async function ContatoPage() {
  const { contato } = await getSiteContent();

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow sl">{contato.heroEyebrow}</div>
          <h1 className="sl d1">{renderHeading(contato.heroTitle)}</h1>
          <p className="fi d2">{contato.heroLead}</p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: "3rem" }}>
        <div className="container">
          <div className="contact-grid">
            <div className="contact-card fi">
              <div className="contact-icon" aria-hidden="true">📍</div>
              <h2>{contato.baseLabel}</h2>
              <p>{contato.baseValue}</p>
            </div>
            <div className="contact-card fi d1">
              <div className="contact-icon" aria-hidden="true">✉️</div>
              <h2>{contato.emailLabel}</h2>
              <a href={`mailto:${contato.emailValue}`}>{contato.emailValue}</a>
            </div>
            <div className="contact-card fi d2">
              <div className="contact-icon" aria-hidden="true">💬</div>
              <h2>{contato.whatsLabel}</h2>
              <p>{contato.whatsValue}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="form-wrap">
        <div className="container">
          <div className="form-box">
            <h2>{contato.formTitle}</h2>
            <p>{contato.formText}</p>
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
