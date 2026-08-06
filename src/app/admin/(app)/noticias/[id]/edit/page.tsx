// ============================================================================
// noticias/[id]/edit/page.tsx — edição de notícia (/admin/noticias/:id/edit)
// ============================================================================
// Carrega a notícia por id (notFound() se ausente) e monta o form preenchido.
// A action de update é vinculada ao id no servidor (updateNews.bind), então o
// client nunca decide QUAL registro é alterado.
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { updateNews } from "../../actions";
import { NewsForm, type NewsFormValues } from "../../news-form";

export const dynamic = "force-dynamic";

// Date -> "YYYY-MM-DD" para o <input type="date"> usando os componentes LOCAIS
// (getFullYear/getMonth/getDate), casando com o parsePublishedAt do actions.ts,
// que interpreta "YYYY-MM-DD" como MEIO-DIA local. Usar toISOString() (UTC)
// deslocava +1 dia ao abrir/salvar à noite em fusos como GMT-4 (MT).
function toDateInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default async function EditNoticiaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const noticia = await prisma.news.findUnique({ where: { id } });
  if (!noticia) notFound();

  const defaultValues: NewsFormValues = {
    title: noticia.title,
    slug: noticia.slug,
    source: noticia.source,
    summary: noticia.summary,
    image: noticia.image ?? "",
    url: noticia.url ?? "",
    publishedAt: toDateInputValue(noticia.publishedAt),
  };

  return (
    <>
      <header className="admin-page-header">
        <span className="admin-page-header__eyebrow">Notícias</span>
        <h1 className="admin-page-header__title">Editar notícia</h1>
        <p className="admin-page-header__subtitle">{noticia.title}</p>
      </header>

      <NewsForm
        action={updateNews.bind(null, noticia.id)}
        defaultValues={defaultValues}
        submitLabel="Salvar alterações"
      />
    </>
  );
}
