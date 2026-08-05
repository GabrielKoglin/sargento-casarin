// ============================================================================
// scripts/create-admin.ts — cria/atualiza o PRIMEIRO admin (idempotente)
// ============================================================================
// Uso:   npm run create-admin
// Lê ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME do ambiente (.env). Se ausentes,
// usa os DEFAULTS de desenvolvimento abaixo. Faz upsert por e-mail, então rodar
// várias vezes é seguro (atualiza nome + senha do mesmo e-mail).
//
// Segue a convenção do prisma/seed.ts: dotenv/config + imports RELATIVOS
// (tsx não resolve o alias "@/..." por padrão) + adapter better-sqlite3.
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hashPassword } from "../src/lib/password";

// DEFAULTS de desenvolvimento — TROQUE em produção via variáveis de ambiente.
const DEFAULT_EMAIL = "admin@casarin.local";
const DEFAULT_PASSWORD = "trocar-esta-senha";
const DEFAULT_NAME = "Administrador";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? DEFAULT_EMAIL).trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? DEFAULT_PASSWORD;
  const name = process.env.ADMIN_NAME ?? DEFAULT_NAME;

  const usingDefaultPassword = password === DEFAULT_PASSWORD;
  const hashed = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, password: hashed },
    create: { email, name, password: hashed },
  });

  console.log(`\n✅ Admin pronto: ${user.email} (${user.name})`);
  console.log("   Login em: /admin/login");
  if (usingDefaultPassword) {
    console.warn(
      "\n⚠️  ATENÇÃO: senha DEFAULT de desenvolvimento em uso " +
        `("${DEFAULT_PASSWORD}").\n` +
        "   TROQUE-A antes de qualquer uso real — defina ADMIN_PASSWORD no .env\n" +
        "   e rode `npm run create-admin` novamente.",
    );
  }
}

main()
  .catch((err) => {
    console.error("Falha ao criar admin:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
