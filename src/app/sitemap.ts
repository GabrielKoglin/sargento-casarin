import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const base = "https://sargentocasarin.com.br"; // Placeholder

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const propostas = await prisma.proposal.findMany({
    select: { slug: true, updatedAt: true },
  });

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
