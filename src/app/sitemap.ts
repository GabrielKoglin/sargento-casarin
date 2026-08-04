import type { MetadataRoute } from "next";

const base = "https://sargentocasarin.com.br"; // Placeholder

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
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
  }));
}
