import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Cria o client sob demanda. DATABASE_URL é OBRIGATÓRIO em runtime — falhamos
// alto se faltar (em vez de cair num banco errado silencioso). Adapter Postgres
// (Prisma 7 exige driver adapter); em serverless a DATABASE_URL aponta pro pooler
// de transação (6543, pgbouncer), pool pequeno por instância.
function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL não configurado. Defina a connection string do Postgres (Supabase) no ambiente.",
    );
  }
  const adapter = new PrismaPg({ connectionString, max: 1 });
  const client = new PrismaClient({ adapter });
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
}

function getClient(): PrismaClient {
  return (globalForPrisma.prisma ??= createClient());
}

// LAZY via Proxy: importar `prisma` NÃO cria o client nem valida a env — o client
// só nasce no PRIMEIRO acesso (ex.: prisma.contact.create). Isso é essencial no
// `next build`: a fase "Collecting page data" IMPORTA os módulos das rotas; se o
// client fosse criado no import, um build sem DATABASE_URL (ou a /sitemap) quebraria
// antes de qualquer try/catch. Agora o erro (se houver) surge na query e é tratado
// pelo try/catch das páginas.
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
