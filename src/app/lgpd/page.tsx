import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "LGPD — Proteção de Dados",
  description:
    "Portal LGPD: seus direitos como titular de dados e como exercê-los, conforme a Lei nº 13.709/2018.",
};

export default function LgpdPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow sl">Proteção de Dados</div>
          <h1 className="sl d1">
            PORTAL <em>LGPD</em>
          </h1>
          <p className="fi d2">
            O nosso compromisso com a proteção dos seus dados pessoais e um canal claro para
            você exercer os seus direitos.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: "3.5rem" }}>
        <div className="container">
          <div className="priv-body">
            <h2>1. Nosso compromisso</h2>
            <p>
              A campanha do Sargento Dickson Casarin, candidato a Deputado Estadual por Mato
              Grosso, trata os dados pessoais com respeito, transparência e segurança, em
              conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
              Este portal reúne, de forma objetiva, os seus direitos e a forma de exercê-los.
            </p>

            <h2>2. Direitos do titular</h2>
            <p>
              Nos termos do art. 18 da LGPD, você, como titular dos dados, pode solicitar a
              qualquer momento:
            </p>
            <ul>
              <li>Confirmação da existência de tratamento dos seus dados.</li>
              <li>Acesso aos dados que mantemos sobre você.</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados.</li>
              <li>
                Anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou
                tratados em desconformidade com a lei.
              </li>
              <li>Portabilidade dos dados, nos termos da regulamentação.</li>
              <li>Eliminação dos dados tratados com base no consentimento.</li>
              <li>
                Informação sobre as entidades com as quais os dados eventualmente foram
                compartilhados.
              </li>
              <li>Revogação do consentimento a qualquer momento.</li>
            </ul>

            <h2>3. Como exercer os seus direitos</h2>
            <p>
              Para exercer qualquer um desses direitos, envie a sua solicitação para{" "}
              <a href="mailto:contato@sargentocasarin.com.br">
                contato@sargentocasarin.com.br
              </a>
              . Poderemos solicitar informações adicionais para confirmar a sua identidade e
              atenderemos ao pedido nos prazos previstos em lei.
            </p>

            <h2>4. Encarregado (DPO)</h2>
            <p>
              O atendimento às questões relacionadas à proteção de dados e ao encarregado
              pelo tratamento de dados pessoais (DPO) é realizado pelo mesmo canal:{" "}
              <a href="mailto:contato@sargentocasarin.com.br">
                contato@sargentocasarin.com.br
              </a>
              . Por esse endereço você pode encaminhar dúvidas, solicitações e comunicações
              sobre o tratamento dos seus dados.
            </p>

            <h2>5. Base legal</h2>
            <p>
              O tratamento dos dados fornecidos pelos formulários do site tem como principal
              base legal o <strong>consentimento</strong> do titular (art. 7º, I, da LGPD),
              manifestado no momento do cadastro e revogável a qualquer tempo.
            </p>

            <h2>6. Segurança e retenção</h2>
            <p>
              Adotamos medidas técnicas e organizacionais adequadas para proteger os dados
              contra acessos não autorizados e situações de perda, alteração ou destruição.
              Os dados são mantidos apenas pelo tempo necessário às finalidades informadas ou
              até a revogação do consentimento.
            </p>

            <h2>7. Relação com a Política de Privacidade</h2>
            <p>
              Este portal complementa a{" "}
              <Link href="/privacidade">Política de Privacidade</Link>, que detalha quais
              dados coletamos, com quais finalidades e como são tratados. Recomendamos a
              leitura de ambos os documentos.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
