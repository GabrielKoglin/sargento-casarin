import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Regras e Normas",
  description:
    "Regras de conduta e participação nos grupos e canais oficiais da campanha do Sargento Dickson Casarin.",
};

export default function RegrasPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow sl">Comunidade</div>
          <h1 className="sl d1">
            REGRAS E <em>NORMAS</em>
          </h1>
          <p className="fi d2">
            As diretrizes de convivência que mantêm os nossos grupos e canais oficiais
            respeitosos, seguros e úteis para todos.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: "3.5rem" }}>
        <div className="container">
          <div className="priv-body">
            <h2>1. Propósito destas regras</h2>
            <p>
              Estas Regras e Normas orientam a <strong>conduta</strong> de quem participa
              dos grupos e canais oficiais da campanha do Sargento Dickson Casarin, candidato
              a Deputado Estadual por Mato Grosso. Elas complementam os{" "}
              <Link href="/termos">Termos de Uso</Link> do site, que tratam das condições
              jurídicas de uso da plataforma.
            </p>

            <h2>2. Canais oficiais</h2>
            <p>
              São canais oficiais os grupos de WhatsApp e os perfis em redes sociais
              divulgados neste site. Conteúdos, avisos e mobilizações compartilhados fora
              desses canais não têm garantia de autenticidade. Na dúvida, confirme sempre
              pelos canais indicados aqui.
            </p>

            <h2>3. Conduta esperada</h2>
            <p>Ao participar dos nossos grupos e canais, você se compromete a:</p>
            <ul>
              <li>Tratar todos com respeito, mesmo diante de opiniões divergentes.</li>
              <li>
                Não praticar discurso de ódio, racismo, discriminação, ameaças ou qualquer
                forma de ataque pessoal.
              </li>
              <li>
                Não divulgar desinformação (fake news), boatos ou conteúdo comprovadamente
                falso.
              </li>
              <li>
                Não enviar spam, correntes, propaganda de terceiros ou mensagens repetitivas
                fora de contexto.
              </li>
              <li>
                Não compartilhar conteúdo ilícito, ofensivo, obsceno ou que viole direitos de
                terceiros.
              </li>
              <li>Respeitar a privacidade dos demais participantes.</li>
            </ul>

            <h2>4. Moderação e remoção de conteúdo</h2>
            <p>
              A equipe da campanha pode moderar as interações, remover conteúdos que violem
              estas regras e, quando necessário, advertir ou remover participantes dos grupos
              e canais oficiais. A moderação visa proteger a comunidade e manter um ambiente
              saudável, sem prejuízo do debate legítimo de ideias.
            </p>

            <h2>5. Uso da marca e da imagem do candidato</h2>
            <p>
              O nome, a marca, os símbolos e as imagens do Sargento Dickson Casarin e da
              campanha não podem ser usados de forma a sugerir apoio, autorização ou
              representação oficial sem consentimento. O compartilhamento dos materiais
              oficiais para fins de divulgação é incentivado, desde que sem alteração de
              contexto ou de sentido.
            </p>

            <h2>6. Doações e apoio</h2>
            <p>
              Toda arrecadação segue rigorosamente a legislação eleitoral e ocorre apenas
              pela plataforma oficial{" "}
              <a
                href="https://apoiar.me/sargentocasarin"
                target="_blank"
                rel="noopener noreferrer"
              >
                apoiar.me/sargentocasarin
              </a>
              . Desconfie de qualquer pedido de dinheiro feito em nome da campanha fora desse
              canal oficial.
            </p>

            <h2>7. Dúvidas e contato</h2>
            <p>
              Em caso de dúvidas sobre estas regras ou para relatar condutas inadequadas nos
              canais oficiais, fale com a nossa equipe pelo e-mail{" "}
              <a href="mailto:atendimento@sargentocasarinmt.com.br">
                atendimento@sargentocasarinmt.com.br
              </a>
              . Estas regras podem ser atualizadas a qualquer momento; a versão vigente estará
              sempre disponível nesta página. Última atualização: agosto de 2026.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
