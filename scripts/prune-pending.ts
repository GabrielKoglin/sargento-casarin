// ============================================================================
// scripts/prune-pending.ts — limpeza retroativa da fila de notícias
// ============================================================================
// Uso:   npx tsx scripts/prune-pending.ts
// Aplica o MESMO filtro de relevância da ingestão (isRelevant) às notícias que
// já estão "pending" e REJEITA as que não citam o candidato — preservando as
// que citam. Rejeitar não apaga (status "rejected"): é reversível, e as
// rejeitadas podem depois ser purgadas por "Excluir rejeitadas" no admin.
//
// Convenção do prisma/seed.ts: dotenv/config + imports RELATIVOS + adapter.
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { isRelevant } from "../src/lib/news-ingest";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

// SQLite limita o nº de variáveis por query — rejeitamos em lotes.
const BATCH = 400;

async function main() {
  const pending = await prisma.news.findMany({
    where: { status: "pending" },
    select: { id: true, title: true, summary: true },
  });

  const irrelevant = pending.filter((n) => !isRelevant(n.title, n.summary));
  const kept = pending.filter((n) => isRelevant(n.title, n.summary));

  console.log(
    `📋 Pendentes: ${pending.length} | Relevantes (mantidas): ${kept.length} | ` +
      `Irrelevantes (rejeitar): ${irrelevant.length}`,
  );

  if (kept.length > 0) {
    console.log("\n✅ Pendentes que CITAM o Casarin (mantidas):");
    for (const n of kept.slice(0, 20)) console.log(`  • ${n.title}`);
  }

  let rejected = 0;
  for (let i = 0; i < irrelevant.length; i += BATCH) {
    const ids = irrelevant.slice(i, i + BATCH).map((n) => n.id);
    const r = await prisma.news.updateMany({
      where: { id: { in: ids } },
      data: { status: "rejected" },
    });
    rejected += r.count;
  }

  console.log(`\n🧹 Rejeitadas: ${rejected}. Fila "pendentes" agora = ${kept.length}.`);
}

main()
  .catch((err) => {
    console.error("Falha na limpeza:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
