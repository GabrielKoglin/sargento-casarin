import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// DATABASE_URL é OBRIGATÓRIO. Em vez de cair num SQLite local silencioso (que
// mascararia um deploy sem banco), falhamos alto se a variável não existir.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL não configurado. Defina a connection string do Postgres (Supabase) no ambiente.",
  );
}

// Adapter Postgres (Prisma 7 exige driver adapter). Em produção serverless a
// DATABASE_URL aponta para o pooler de transação (6543, pgbouncer) — pool pequeno
// por instância. SSL exigido pelo Supabase.
const adapter = new PrismaPg({ connectionString, max: 1 });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
