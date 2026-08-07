import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const base = "https://www.sargentocasarinmt.com.br";

export const dynamic = "force-dynamic";

const routes = [
  "",
  "/sobre",
  "/propostas",
  "/manifesto",
  "/noticias",
  "/agenda",
  "/galeria",
  "/tropa",
  "/contato",
  "/ajudar",
  "/midias",
  "/privacidade",
  "/termos",
  "/cookies",
  "/lgpd",
  "/regras",
];

// Busca os slugs de propostas para incluir as rotas dinâmicas. Uma falha de I/O
// não pode derrubar o sitemap: cai numa lista vazia e o sitemap sai só com as
// rotas estáticas em vez de estourar.
async function loadPropostaSlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
  try {
    return await prisma.proposal.findMany({
      select: { slug: true, updatedAt: true },
    });
  } catch (error) {
    console.error("Falha ao carregar slugs de propostas para o sitemap.", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const propostas = await loadPropostaSlugs();

  return [
    ...routes.map((route) => ({
      url: `${base}${route}`,
      lastModified: new Date(),
    })),
    ...propostas.map((proposta) => ({
      url: `${base}/propostas/${proposta.slug}`,
      lastModified: proposta.updatedAt,
    })),
  ];
}
