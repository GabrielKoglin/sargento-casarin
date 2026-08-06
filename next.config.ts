import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // A guia Mídia sobe fotos via Server Action (multipart). O teto padrão do
    // Next é 1MB, o que rejeitaria fotos reais (3–8MB) ANTES da action rodar.
    // A própria action valida o limite real de 12MB (midia/actions.ts).
    serverActions: { bodySizeLimit: "12mb" },
  },
};

export default nextConfig;
