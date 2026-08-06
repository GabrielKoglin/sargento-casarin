import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // A guia Mídia sobe fotos via Server Action (multipart). O teto padrão do
    // Next é 1MB, o que rejeitaria fotos reais (3–8MB) ANTES da action rodar.
    // A própria action valida o limite real de 12MB (midia/actions.ts).
    // OBS: bodySizeLimit é GLOBAL (vale para todas as Server Actions).
    serverActions: { bodySizeLimit: "12mb" },
  },
  // Cabeçalhos de segurança aplicados a TODAS as rotas.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
