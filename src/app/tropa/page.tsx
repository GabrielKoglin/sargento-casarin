import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Entre para a Tropa",
  description:
    "Faça parte da Tropa do Sargento Casarin: receba conteúdos exclusivos e participe das mobilizações em Mato Grosso.",
};

export default function TropaPage() {
  return (
    <>
      <section className="tropa-hero">
        <div className="container">
          <h1 className="sl">
            ENTRE PARA A <em>TROPA</em>
          </h1>
          <p className="fi d1">
            Receba conteúdos exclusivos, participe das mobilizações e ajude a levar essa
            mensagem para todo o Mato Grosso.
          </p>
        </div>
      </section>

      <div className="form-wrap">
        <div className="container">
          <div className="form-box">
            <h2>Alistamento voluntário</h2>
            <p>
              Preencha seus dados para entrar na rede de apoiadores. Sem spam — só o que
              importa para a missão.
            </p>
            <ContactForm
              origin="tropa"
              submitLabel="Quero entrar para a Tropa ➔"
              successTitle="Bem-vindo à Tropa!"
              successText="Cadastro recebido. Em breve você receberá as novidades e os canais oficiais da pré-campanha."
            />
          </div>
        </div>
      </div>
    </>
  );
}
