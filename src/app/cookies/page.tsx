import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Cookies",
  description:
    "Como o site utiliza cookies, para quê servem e como você pode gerenciá-los, conforme a LGPD.",
};

export default function CookiesPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow sl">Cookies</div>
          <h1 className="sl d1">
            POLÍTICA DE <em>COOKIES</em>
          </h1>
          <p className="fi d2">
            Transparência sobre os cookies deste site: o que são, quais utilizamos e como
            você controla o seu uso.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: "3.5rem" }}>
        <div className="container">
          <div className="priv-body">
            <h2>1. O que são cookies</h2>
            <p>
              Cookies são pequenos arquivos de texto que o site armazena no seu navegador
              quando você o visita. Eles servem para que as páginas funcionem corretamente,
              lembrem preferências e, quando autorizado, ajudem a entender como o site é
              utilizado. Cookies não executam programas e não transmitem vírus.
            </p>

            <h2>2. Tipos de cookies que utilizamos</h2>
            <ul>
              <li>
                <strong>Essenciais:</strong> necessários ao funcionamento básico do site,
                como segurança, navegação entre páginas e envio de formulários. Sem eles o
                site não opera adequadamente e, por isso, não dependem de consentimento.
              </li>
              <li>
                <strong>Funcionais:</strong> guardam preferências e escolhas feitas por você
                para melhorar a experiência de navegação.
              </li>
              <li>
                <strong>De medição de audiência:</strong> ajudam a entender de forma
                agregada como os visitantes usam o site. Estes só são ativados{" "}
                <strong>mediante o seu consentimento</strong>.
              </li>
            </ul>

            <h2>3. Finalidade</h2>
            <p>
              Utilizamos cookies para manter o site seguro e estável, viabilizar o envio de
              mensagens e cadastros, lembrar preferências e, apenas com a sua autorização,
              medir a audiência das páginas para aprimorar o conteúdo da campanha.
            </p>

            <h2>4. Como gerenciar e desativar</h2>
            <p>
              Você pode gerenciar, bloquear ou apagar cookies diretamente nas configurações
              do seu navegador. A maioria dos navegadores (Chrome, Firefox, Safari, Edge)
              permite recusar cookies ou ser avisado antes de armazená-los, geralmente na
              seção de privacidade ou segurança das configurações. Ao desativar cookies
              essenciais, algumas funções do site podem deixar de funcionar.
            </p>

            <h2>5. Consentimento</h2>
            <p>
              Ao acessar o site, um banner informa sobre o uso de cookies e coleta o seu
              consentimento para as categorias não essenciais, como a medição de audiência.
              O consentimento é livre e pode ser <strong>revisto ou revogado</strong> a
              qualquer momento, seja pelo próprio banner, seja limpando os cookies no
              navegador.
            </p>

            <h2>6. Base legal</h2>
            <p>
              O uso de cookies não essenciais tem como base legal o{" "}
              <strong>consentimento</strong> do titular (art. 7º, I, da Lei nº 13.709/2018 —
              LGPD). Os cookies essenciais fundamentam-se no legítimo interesse de garantir o
              funcionamento seguro do site.
            </p>

            <h2>7. Alterações</h2>
            <p>
              Esta Política de Cookies pode ser atualizada a qualquer momento para refletir
              mudanças no site ou na legislação. A versão vigente estará sempre disponível
              nesta página. Última atualização: agosto de 2026.
            </p>

            <h2>8. Contato</h2>
            <p>
              Em caso de dúvidas sobre esta política, escreva para{" "}
              <a href="mailto:contato@sargentocasarin.com.br">
                contato@sargentocasarin.com.br
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
