// ============================================================================
// noticias/[slug]/page.tsx — PÁGINA da matéria de AUTORIA PRÓPRIA
// ============================================================================
// Só as notícias NOSSAS (com `content`) têm página no site; as manchetes
// agregadas dos feeds não passam por aqui (o card delas abre o portal externo).
// Espelha o padrão de /propostas/[slug]: loader tolerante a I/O + notFound()
// FORA do try/catch. Exige status "approved" — rascunho/rejeitada nunca vaza.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { News } from "@/generated/prisma/client";
import { RichText } from "@/components/rich-text";

export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" });

// Carrega a matéria pelo slug. Só entrega se estiver APROVADA e for de autoria
// própria (tem `content`) — uma manchete agregada (sem `content`) não tem página
// e cai no 404 do chamador. Falha de I/O vira `null` (404), nunca 500.
async function loadMateria(slug: string): Promise<News | null> {
  try {
    const news = await prisma.news.findUnique({ where: { slug } });
    if (!news || news.status !== "approved" || !news.content) return null;
    return news;
  } catch (error) {
    console.error("Falha ao carregar matéria.", error);
    return null;
  }
}

export async function generateMetadata(
  props: PageProps<"/noticias/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const materia = await loadMateria(slug);
  if (!materia) return { title: "Notícia" };

  const url = `/noticias/${materia.slug}`;
  return {
    title: materia.title,
    description: materia.summary,
    alternates: { canonical: url },
    openGraph: {
      title: materia.title,
      description: materia.summary,
      url,
      type: "article",
      publishedTime: materia.publishedAt.toISOString(),
      // Imagem própria da matéria quando houver; senão herda o opengraph-image.tsx.
      ...(materia.image ? { images: [{ url: materia.image }] } : {}),
    },
  };
}

export default async function MateriaPage(props: PageProps<"/noticias/[slug]">) {
  const { slug } = await props.params;
  const materia = await loadMateria(slug);
  // Registro inexistente / não aprovado / sem corpo → 404 (nunca 500).
  if (!materia) notFound();

  // Assinatura: "Por <author>" quando houver autoria; senão a fonte (ex.: o
  // nome da campanha, que já vem no card).
  const author = materia.author?.trim();
  const byline = author ? `Por ${author}` : materia.source;

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow sl">Notícias</div>
          <h1 className="sl d1">{materia.title}</h1>
          <p className="fi d2" style={{ color: "rgba(255,255,255,.6)" }}>
            {byline ? <>{byline} · </> : null}
            {dateFormat.format(materia.publishedAt)}
          </p>
        </div>
      </section>

      {materia.image && (
        <div className="container">
          {/* Imagem de host arbitrário (upload no bucket/CMS); next/image exigiria
              hostname fixo em images.remotePatterns, então usamos <img>. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="proposta-img" src={materia.image} alt={materia.title} />
        </div>
      )}

      <section className="section">
        <div className="container">
          {materia.summary && (
            <p className="materia-lead">{materia.summary}</p>
          )}

          <div className="priv-body">
            <RichText md={materia.content ?? ""} />
          </div>

          <div className="mt-bloco" style={{ marginTop: "3rem" }}>
            <h2>Faça parte dessa missão</h2>
            <p>
              Entre nos nossos grupos e acompanhe de perto a campanha do Sargento
              Casarin por todo o Mato Grosso.
            </p>
            <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
              <Link href="/tropa" className="btn btn-gold">
                Nossos Grupos ➔
              </Link>
              <Link href="/noticias" className="btn btn-ghost">
                Ver todas as notícias
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
