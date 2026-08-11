// ============================================================================
// admin/(app)/conteudo/page.tsx — editor do conteúdo do site (/admin/conteudo)
// ============================================================================
// Server Component. Carrega o conteúdo atual (getSiteContent → banco ou padrão)
// e entrega ao formulário client. force-dynamic: o editor sempre reflete o que
// está salvo agora.
import { getSiteContent } from "@/lib/site-content";
import { ContentForm } from "./content-form";

export const dynamic = "force-dynamic";

export default async function AdminConteudoPage() {
  const content = await getSiteContent();

  return (
    <>
      <header className="admin-page-header">
        <span className="admin-page-header__eyebrow">Site</span>
        <h1 className="admin-page-header__title">Conteúdo</h1>
        <p className="admin-page-header__subtitle">
          Edite os textos da home (&quot;Por que entrar para a política&quot;), do
          Manifesto e da página &quot;Quem é o Casarin&quot; — bio, trajetória,
          comenda e formação. As mudanças aparecem no site logo após salvar.
        </p>
      </header>

      <ContentForm initial={content} />
    </>
  );
}
