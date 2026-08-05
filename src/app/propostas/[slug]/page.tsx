import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/propostas/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const proposta = await prisma.proposal.findUnique({ where: { slug } });
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
  const proposta = await prisma.proposal.findUnique({ where: { slug } });
  if (!proposta) notFound();

  const goals = proposta.goals.split("\n").filter(Boolean);
  const benefits = proposta.benefits.split("\n").filter(Boolean);

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow sl">{proposta.category}</div>
          <h1 className="sl d1">{proposta.title}</h1>
          <p className="fi d2">{proposta.description}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="priv-body">
            <h2>O problema</h2>
            <p>{proposta.problem}</p>

            <h2>Objetivo</h2>
            <p>{proposta.objective}</p>

            <h2>Como vamos fazer</h2>
            <p>{proposta.solution}</p>

            <h2>Metas</h2>
            <ul>
              {goals.map((goal, index) => (
                <li key={`${proposta.id}-goal-${index}`}>{goal}</li>
              ))}
            </ul>

            <h2>Benefícios para você</h2>
            <ul>
              {benefits.map((benefit, index) => (
                <li key={`${proposta.id}-benefit-${index}`}>{benefit}</li>
              ))}
            </ul>

            {proposta.faq && (
              <>
                <h2>Perguntas frequentes</h2>
                <p>{proposta.faq}</p>
              </>
            )}
          </div>

          <div className="mt-bloco" style={{ marginTop: "3rem" }}>
            <h2>Concorda com essa proposta?</h2>
            <p>
              Entre para a Tropa e ajude a levar essa ideia para todo o Mato Grosso.
            </p>
            <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
              <Link href="/tropa" className="btn btn-gold">
                Entre para a Tropa ➔
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
