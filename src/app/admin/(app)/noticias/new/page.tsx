// ============================================================================
// noticias/new/page.tsx — criação de notícia (/admin/noticias/new)
// ============================================================================
// Guarda de sessão redundante (defesa em profundidade) além do layout e do
// Proxy. createNews também revalida a sessão por conta própria.
import { requireArea } from "@/lib/permissions";
import { createNews } from "../actions";
import { NewsForm } from "../news-form";

export default async function NewNoticiaPage() {
  await requireArea("noticias");

  return (
    <>
      <header className="admin-page-header">
        <span className="admin-page-header__eyebrow">Notícias</span>
        <h1 className="admin-page-header__title">Nova notícia</h1>
        <p className="admin-page-header__subtitle">
          Publique uma nova notícia na página pública.
        </p>
      </header>

      <NewsForm action={createNews} submitLabel="Criar notícia" />
    </>
  );
}
