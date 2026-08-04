import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Condições de uso do site do Sargento Dickson Casarin.",
};

export default function TermosPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow sl">Regras de engajamento</div>
          <h1 className="sl d1">
            TERMOS DE <em>USO</em>
          </h1>
        </div>
      </section>

      <section className="section" style={{ paddingTop: "3.5rem" }}>
        <div className="container">
          <div className="priv-body">
            <h2>1. Aceitação</h2>
            <p>
              Ao acessar este site, você concorda com estes Termos de Uso e com a{" "}
              <Link href="/privacidade">Política de Privacidade</Link>. Se não concordar,
              interrompa o uso do site.
            </p>

            <h2>2. Finalidade do site</h2>
            <p>
              Este é um site institucional de pré-campanha, destinado a divulgar a
              trajetória, as propostas e os canais de participação do Sargento Dickson
              Casarin, pré-candidato a Deputado Estadual por Mato Grosso.
            </p>

            <h2>3. Uso adequado</h2>
            <ul>
              <li>Não utilize o site para fins ilícitos ou para enviar conteúdo ofensivo.</li>
              <li>Não tente burlar mecanismos de segurança ou coletar dados de terceiros.</li>
              <li>Forneça apenas informações verdadeiras nos formulários.</li>
            </ul>

            <h2>4. Propriedade intelectual</h2>
            <p>
              Textos, marcas, fotos e demais conteúdos deste site pertencem à pré-campanha
              ou a seus licenciantes. O compartilhamento para fins de divulgação é
              incentivado, desde que sem alteração de contexto.
            </p>

            <h2>5. Responsabilidade</h2>
            <p>
              Trabalhamos para manter as informações corretas e o site disponível, mas não
              garantimos operação ininterrupta. Links para sites de terceiros são de
              responsabilidade dos respectivos titulares.
            </p>

            <h2>6. Alterações</h2>
            <p>
              Estes termos podem ser atualizados a qualquer momento. A versão vigente estará
              sempre disponível nesta página.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
