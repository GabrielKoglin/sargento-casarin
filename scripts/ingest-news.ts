// ============================================================================
// scripts/ingest-news.ts — roda a ingestão de manchetes e imprime o resumo
// ============================================================================
// Uso:   npm run ingest-news
// Busca os feeds configurados em src/lib/news-sources.ts, normaliza os itens e
// insere as manchetes NOVAS com status "pending" (moderação). Idempotente:
// dedupe por URL, então rodar várias vezes não duplica notícias.
//
// Segue a convenção do prisma/seed.ts: dotenv/config + imports RELATIVOS
// (tsx não resolve o alias "@/...") + adapter better-sqlite3.
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { ingestNews } from "../src/lib/news-ingest";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("⏳ Ingerindo manchetes dos portais de Mato Grosso...\n");

  const summary = await ingestNews(prisma);

  console.log("📊 Resumo da ingestão:");
  console.log(
    JSON.stringify(
      {
        sources: summary.sources,
        fetched: summary.fetched,
        inserted: summary.inserted,
        skipped: summary.skipped,
        errors: summary.errors,
      },
      null,
      2,
    ),
  );

  const samples = summary.inserted_news.slice(0, 5);
  if (samples.length > 0) {
    console.log(
      `\n📰 Primeiras ${samples.length} manchetes inseridas (status pending):`,
    );
    for (const n of samples) {
      console.log(`  • [${n.source}] ${n.title}`);
      console.log(`    ${n.url}`);
    }
  } else {
    console.log("\n⚠️  Nenhuma manchete nova inserida nesta execução.");
  }
}

main()
  .catch((err) => {
    console.error("Falha na ingestão:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
