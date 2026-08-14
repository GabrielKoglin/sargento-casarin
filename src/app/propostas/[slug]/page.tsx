import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Proposal } from "@/generated/prisma/client";
import { RichText } from "@/components/rich-text";

export const dynamic = "force-dynamic";

// Lê a proposta pelo slug. Uma falha de I/O vira `null` (tratado como "não
// encontrada" pelo chamador) em vez de estourar 500. O `notFound()` legítimo
// fica FORA daqui — quem chama decide o 404 a partir do `null` retornado.
async function loadProposta(slug: string): Promise<Proposal | null> {
  try {
    return await prisma.proposal.findUnique({ where: { slug } });
  } catch (error) {
    console.error("Falha ao carregar proposta.", error);
    return null;
  }
}

export async function generateMetadata(
  props: PageProps<"/propostas/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const proposta = await loadProposta(slug);
  if (!proposta) return { title: "Proposta" };

  const url = `/propostas/${proposta.slug}`;
  return {
    title: proposta.title,
    description: proposta.description,
    alternates: { canonical: url },
    openGraph: {
      title: proposta.title,
      description: proposta.description,
      url,
      type: "article",
      // Se a proposta tiver imagem propria, usa; senao herda o opengraph-image.tsx padrao do site.
      ...(proposta.image ? { images: [{ url: proposta.image }] } : {}),
    },
  };
}

export default async function PropostaPage(props: PageProps<"/propostas/[slug]">) {
  const { slug } = await props.params;
  const proposta = await loadProposta(slug);
  // Registro inexistente OU leitura falha → 404 (nunca 500). `notFound()` mora
  // fora do try/catch do loader para não ser engolido.
  if (!proposta) notFound();

  return (
    <>
      <section className="page-hero">
        <div className="container">
          {proposta.category && <div className="eyebrow sl">{proposta.category}</div>}
          <h1 className="sl d1">{proposta.title}</h1>
          {proposta.description && <p className="fi d2">{proposta.description}</p>}
        </div>
      </section>

      {proposta.image && (
        <div className="container">
          {/* Imagem de host arbitrário (upload no bucket/CMS); next/image exigiria
              hostname fixo em images.remotePatterns, então usamos <img>. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="proposta-img" src={proposta.image} alt={proposta.title} />
        </div>
      )}

      <section className="section">
        <div className="container">
          <div className="priv-body">
            {proposta.content ? (
              <RichText md={proposta.content} />
            ) : (
              !proposta.image &&
              !proposta.description && (
                <p>
                  Proposta em elaboração. Em breve o conteúdo completo estará
                  disponível aqui.
                </p>
              )
            )}
          </div>

          <div className="mt-bloco" style={{ marginTop: "3rem" }}>
            <h2>Concorda com essa proposta?</h2>
            <p>
              Entre nos nossos grupos e ajude a levar essa ideia para todo o Mato Grosso.
            </p>
            <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
              <Link href="/tropa" className="btn btn-gold">
                Nossos Grupos ➔
              </Link>
              <Link href="/propostas" className="btn btn-ghost">
                Ver todas as propostas
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
