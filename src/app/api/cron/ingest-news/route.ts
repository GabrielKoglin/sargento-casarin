// ============================================================================
// api/cron/ingest-news/route.ts — ingestão agendada dos feeds de notícias
// ============================================================================
// Route Handler (Next 16) para disparar a ingestão por um cron externo (ex.:
// Vercel Cron, GitHub Actions, cron do servidor) quando o site for a produção.
// Runtime Node (usa fetch + Prisma via adapter better-sqlite3).
//
// PROTEÇÃO: exige o segredo CRON_SECRET, via header
//   Authorization: Bearer <CRON_SECRET>
// ou querystring ?secret=<CRON_SECRET>. Sem match → 401. Com match, chama
// ingestNews(prisma) e devolve o resumo em JSON. O dedupe por URL do motor
// evita duplicar notícias em execuções repetidas.
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ingestNews } from "@/lib/news-ingest";

// Nunca cachear: sempre roda no request, lê env/headers e escreve no banco.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Confere o segredo do cron no header Authorization ou no ?secret=. */
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  // Sem segredo configurado, negamos tudo (nunca abrir o endpoint por engano).
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  return request.nextUrl.searchParams.get("secret") === secret;
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
