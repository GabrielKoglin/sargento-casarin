import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { getSiteContent, renderHeading } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Seja um Apoiador",
  description:
    "Cadastre-se como apoiador do Sargento Casarin e ajude a levar a mensagem por todo o Mato Grosso.",
};

export const dynamic = "force-dynamic";

export default async function TropaPage() {
  const { tropa } = await getSiteContent();

  return (
    <>
      <section className="tropa-hero">
        <div className="container">
          <h1 className="sl">{renderHeading(tropa.heroTitle)}</h1>
          <p className="fi d1">{tropa.heroLead}</p>
        </div>
      </section>

      <div className="form-wrap">
        <div className="container">
          <div className="form-box">
            <h2>{tropa.formTitle}</h2>
            <p>{tropa.formText}</p>
            <ContactForm
              origin="tropa"
              submitLabel="Quero participar ➔"
              successTitle="Bem-vindo à Tropa!"
              successText="Cadastro recebido. Em breve você receberá as novidades e os canais oficiais da campanha."
            />
          </div>
        </div>
      </div>
    </>
  );
}
