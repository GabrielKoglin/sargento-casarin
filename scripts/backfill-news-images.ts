// ============================================================================
// scripts/backfill-news-images.ts — preenche/re-hospeda a imagem das notícias
// ============================================================================
// Uso:   npm run backfill-news-images
// As manchetes vindas do Google News nasceram sem imagem (o feed não traz). Este
// script, para cada notícia que ainda NÃO aponta para o nosso storage:
//   1) descobre a imagem de origem — a og:image da matéria real (resolvendo o
//      link do Google News) ou a URL de hotlink que já estiver no banco;
//   2) RE-HOSPEDA no nosso bucket (baixa → otimiza → sobe) e grava a URL nossa.
// Servir do nosso domínio evita o bloqueio de hotlink de vários portais de MT.
// Idempotente: quem já está no nosso storage é pulado; rodar de novo é seguro.
//
// Segue a convenção do prisma/seed.ts: dotenv/config + imports RELATIVOS.
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { resolveArticleImage, rehostImage } from "../src/lib/news-ingest";
import { isStorageUrl } from "../src/lib/storage";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

// Cada item faz download + otimização + upload (e, quando não há origem, ainda
// resolve o link do Google News). Pool modesto para não martelar os portais.
const POOL_SIZE = 4;

async function main() {
  const all = await prisma.news.findMany({
    where: { NOT: { url: null } },
    select: { id: true, url: true, image: true, title: true },
  });
  // Pula quem já está servido do nosso storage; processa nulos e hotlinks.
  const todo = all.filter((n) => !n.image || !isStorageUrl(n.image));
  console.log(
    `🖼️  ${todo.length} notícias para re-hospedar (${all.length - todo.length} já no storage).\n`,
  );

  let ok = 0;
  let semImagem = 0;
  let cursor = 0;

  async function drain(): Promise<void> {
    while (cursor < todo.length) {
      const item = todo[cursor];
      cursor += 1;

      // Origem: a URL de hotlink que já temos, ou a og:image resolvida agora.
      const src =
        item.image && !isStorageUrl(item.image)
          ? item.image
          : await resolveArticleImage(item.url as string);
      if (!src) {
        semImagem += 1;
        console.log(`  ✗ ${item.title.slice(0, 50)} (sem imagem de origem)`);
        continue;
      }

      const hosted = await rehostImage(src);
      if (hosted) {
        await prisma.news.update({ where: { id: item.id }, data: { image: hosted } });
        ok += 1;
        console.log(`  ✓ ${item.title.slice(0, 50)}`);
      } else {
        semImagem += 1;
        console.log(`  ✗ ${item.title.slice(0, 50)} (re-host falhou)`);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(POOL_SIZE, todo.length) }, () => drain()),
  );

  console.log(`\n📊 Concluído: ${ok} re-hospedadas, ${semImagem} sem imagem.`);
}

main()
  .catch((err) => {
    console.error("Falha no backfill:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
