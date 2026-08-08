import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Seja um Apoiador",
  description:
    "Cadastre-se como apoiador do Sargento Casarin e ajude a levar a mensagem por todo o Mato Grosso.",
};

export default function TropaPage() {
  return (
    <>
      <section className="tropa-hero">
        <div className="container">
          <h1 className="sl">
            SEJA UM <em>APOIADOR</em>
          </h1>
          <p className="fi d1">
            Cadastre-se na rede de apoiadores do Sargento Casarin e ajude a levar
            essa mensagem para todo o Mato Grosso.
          </p>
        </div>
      </section>

      <div className="form-wrap">
        <div className="container">
          <div className="form-box">
            <h2>Seja um apoiador do Casarin</h2>
            <p>
              Preencha seus dados para entrar na rede de apoiadores. Sem spam — só o que
              importa para a missão.
            </p>
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
