// ============================================================================
// scripts/promote-owners.ts — promove contas EXISTENTES a "owner" (titular)
// ============================================================================
// Uso pontual após adicionar o campo `role` ao User: as contas que já existiam
// (a equipe original) viram titulares. Novos membros criados pelo painel nascem
// "editor". Idempotente. Convenção do projeto: dotenv + adapter better-sqlite3.
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const owners = await prisma.user.count({ where: { role: "owner" } });
  if (owners > 0) {
    console.log(`Já existe(m) ${owners} titular(es). Nada a fazer.`);
    return;
  }
  const { count } = await prisma.user.updateMany({ data: { role: "owner" } });
  console.log(`✅ ${count} conta(s) promovida(s) a titular (owner).`);
}

main()
  .catch((err) => {
    console.error("Falha ao promover titulares:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
