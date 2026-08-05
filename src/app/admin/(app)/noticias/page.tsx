// ============================================================================
// noticias/page.tsx — LISTA de notícias (/admin/noticias)
// ============================================================================
// Herda o shell + guarda de sessão de (app)/layout.tsx. As Server Actions
// chamadas aqui (deleteNews) revalidam a sessão por conta própria.
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteNews } from "./actions";
import { DeleteButton } from "./news-form";

// Lista sempre "ao vivo" — nunca pré-renderizar em build.
export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" });

export default async function AdminNoticiasPage() {
  const noticias = await prisma.news.findMany({
    orderBy: { publishedAt: "desc" },
  });

  return (
    <>
      <header
        className="admin-page-header"
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <span className="admin-page-header__eyebrow">Conteúdo</span>
          <h1 className="admin-page-header__title">Notícias</h1>
          <p className="admin-page-header__subtitle">
            Publicações exibidas na página pública de notícias.
          </p>
        </div>
        <Link href="/admin/noticias/new" className="admin-btn">
          Nova notícia
        </Link>
      </header>

      {noticias.length === 0 ? (
        <div className="admin-note">
          Nenhuma notícia cadastrada ainda.{" "}
          <Link
            href="/admin/noticias/new"
            style={{ color: "var(--a-green-bright)", fontWeight: 600 }}
          >
            Criar a primeira
          </Link>
          .
        </div>
      ) : (
        <div
          className="overflow-x-auto rounded"
          style={{ border: "1px solid var(--a-line)", background: "var(--a-panel)" }}
        >
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--a-line)" }}>
                <th
                  className="px-4 py-3 text-xs font-bold uppercase tracking-wider"
                  style={{ color: "var(--a-muted)" }}
                >
                  Título
                </th>
                <th
                  className="px-4 py-3 text-xs font-bold uppercase tracking-wider"
                  style={{ color: "var(--a-muted)" }}
                >
                  Fonte
                </th>
                <th
                  className="px-4 py-3 text-xs font-bold uppercase tracking-wider"
                  style={{ color: "var(--a-muted)" }}
                >
                  Publicação
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider"
                  style={{ color: "var(--a-muted)" }}
                >
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {noticias.map((noticia) => (
                <tr
                  key={noticia.id}
                  className="[&:not(:last-child)]:border-b"
                  style={{ borderColor: "var(--a-line)" }}
                >
                  <td
                    className="px-4 py-3 font-medium"
                    style={{ color: "var(--a-text)" }}
                  >
                    {noticia.title}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--a-muted)" }}>
                    {noticia.source}
                  </td>
                  <td
                    className="whitespace-nowrap px-4 py-3"
                    style={{ color: "var(--a-muted)" }}
                  >
                    {dateFormat.format(noticia.publishedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/admin/noticias/${noticia.id}/edit`}
                        style={{ color: "var(--a-green-bright)", fontWeight: 600 }}
                      >
                        Editar
                      </Link>
                      <form action={deleteNews.bind(null, noticia.id)}>
                        <DeleteButton label={noticia.title} />
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
