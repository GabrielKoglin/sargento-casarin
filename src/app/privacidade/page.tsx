import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Como tratamos os seus dados pessoais, conforme a LGPD.",
};

export default function PrivacidadePage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow sl">LGPD</div>
          <h1 className="sl d1">
            POLÍTICA DE <em>PRIVACIDADE</em>
          </h1>
          <p className="fi d2">
            Transparência total sobre como coletamos, usamos e protegemos os seus dados.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: "3.5rem" }}>
        <div className="container">
          <div className="priv-body">
            <h2>1. Quem somos</h2>
            <p>
              Este site é o canal institucional da campanha do Sargento Dickson Casarin,
              candidato a Deputado Estadual por Mato Grosso. Ao usar o site, você
              concorda com os termos desta política, elaborada em conformidade com a Lei
              Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
            </p>

            <h2>2. Dados que coletamos</h2>
            <ul>
              <li>
                Dados fornecidos por você nos formulários: nome, e-mail, telefone/WhatsApp,
                cidade e mensagem.
              </li>
              <li>
                Dados de navegação coletados automaticamente: endereço IP, tipo de navegador
                e páginas visitadas, quando aplicável.
              </li>
            </ul>

            <h2>3. Finalidade do tratamento</h2>
            <ul>
              <li>Responder às mensagens enviadas pelos canais de contato.</li>
              <li>
                Enviar comunicações da campanha (novidades, eventos e mobilizações) a
                quem se cadastrou voluntariamente.
              </li>
              <li>Organizar a rede de apoiadores por região.</li>
            </ul>

            <h2>4. Base legal</h2>
            <p>
              O tratamento é realizado com base no <strong>consentimento</strong> (art. 7º,
              I, da LGPD), manifestado no momento do cadastro. Você pode revogar o
              consentimento a qualquer momento.
            </p>

            <h2>5. Compartilhamento</h2>
            <p>
              Os seus dados não são vendidos nem compartilhados com terceiros para fins
              comerciais. Eles são acessados apenas pela equipe da campanha e por
              fornecedores de tecnologia estritamente necessários à operação do site.
            </p>

            <h2>6. Seus direitos</h2>
            <ul>
              <li>Confirmar a existência de tratamento dos seus dados.</li>
              <li>Acessar, corrigir ou atualizar os seus dados.</li>
              <li>Solicitar a exclusão dos dados e a revogação do consentimento.</li>
              <li>Solicitar a portabilidade, nos termos da lei.</li>
            </ul>
            <p>
              Para exercer qualquer um desses direitos, escreva para{" "}
              <a href="mailto:atendimento@sargentocasarinmt.com.br">
                atendimento@sargentocasarinmt.com.br
              </a>
              .
            </p>

            <h2>7. Cookies</h2>
            <p>
              O site pode utilizar cookies essenciais ao seu funcionamento e, mediante
              consentimento, cookies de medição de audiência. Você pode desativá-los nas
              configurações do seu navegador.
            </p>

            <h2>8. Segurança e retenção</h2>
            <p>
              Adotamos medidas técnicas e organizacionais para proteger os dados. As
              informações são mantidas apenas pelo tempo necessário às finalidades desta
              política ou até a revogação do consentimento.
            </p>

            <h2>9. Alterações</h2>
            <p>
              Esta política pode ser atualizada a qualquer momento. A versão vigente estará
              sempre disponível nesta página.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
