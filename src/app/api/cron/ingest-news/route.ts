// ============================================================================
// api/cron/ingest-news/route.ts — ingestão agendada dos feeds de notícias
// ============================================================================
// Route Handler (Next 16) para disparar a ingestão por um cron externo (ex.:
// Vercel Cron, GitHub Actions, cron do servidor) quando o site for a produção.
// Runtime Node (usa fetch + Prisma via adapter better-sqlite3).
//
// PROTEÇÃO: exige o segredo CRON_SECRET. Forma PREFERIDA (não vaza em logs):
//   Authorization: Bearer <CRON_SECRET>
// A comparação é timing-safe (crypto.timingSafeEqual). O ?secret=<CRON_SECRET>
// é mantido só como fallback de teste (aparece em logs/URL — evite em produção).
// Sem match → 401. Com match, chama ingestNews(prisma) e devolve o resumo em
// JSON. O dedupe por URL do motor evita duplicar notícias em execuções repetidas.
import type { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { ingestNews } from "@/lib/news-ingest";

// Nunca cachear: sempre roda no request, lê env/headers e escreve no banco.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Teto de execução em produção (Vercel etc.): a ingestão paralela cabe bem
// abaixo, mas o teto evita que um provedor lento segure a função para sempre.
export const maxDuration = 60;

/**
 * Comparação de strings resistente a timing. timingSafeEqual exige buffers de
 * MESMO tamanho — tamanhos diferentes já significam "não bate", então
 * retornamos false sem comparar (e sem vazar o tamanho pela duração).
 */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** Confere o segredo do cron: header Bearer (preferido) ou ?secret= (fallback). */
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  // Sem segredo configurado, negamos tudo (nunca abrir o endpoint por engano).
  if (!secret) return false;

  // Preferencial: Authorization: Bearer <CRON_SECRET>.
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    if (safeEqual(token, secret)) return true;
  }

  // Fallback opcional para teste (vaza em logs/URL — não use em produção).
  const qp = request.nextUrl.searchParams.get("secret");
  if (qp && safeEqual(qp, secret)) return true;

  return false;
}

async function handle(request: NextRequest): Promise<Response> {
  if (!isAuthorized(request)) {
    return Response.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const summary = await ingestNews(prisma);
    return Response.json({ ok: true, summary });
  } catch (error) {
    console.error("Cron ingest-news falhou.", error);
    return Response.json(
      { ok: false, error: "Ingestion failed" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest): Promise<Response> {
  return handle(request);
}

export async function POST(request: NextRequest): Promise<Response> {
  return handle(request);
}
