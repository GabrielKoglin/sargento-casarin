import type { MetadataRoute } from "next";

const base = "https://sargentocasarin.com.br"; // Placeholder — mesma metadataBase de layout.tsx

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Painel administrativo e rotas de API não devem ser indexados.
      disallow: ["/admin", "/api"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
