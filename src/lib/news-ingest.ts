// ============================================================================
// src/lib/news-ingest.ts — motor de ingestão de manchetes (RSS + Google News)
// ============================================================================
// Agrega manchetes dos portais de Mato Grosso configurados em news-sources.ts.
//
// LEGAL/ÉTICO: guardamos SÓ manchete + resumo curto + nome da fonte + LINK de
// volta ao artigo original + data. NUNCA o conteúdo completo. Toda notícia
// ingerida nasce com status "pending" (moderação: o admin aprova antes do ar).
//
// Node/server-side apenas (usa `fetch` + `rss-parser`). O PrismaClient é
// INJETADO pelo chamador — assim o script tsx (imports relativos, sem o alias
// "@/...") cria o seu próprio client, e o Next pode passar o singleton
// compartilhado em `@/lib/prisma`. O `import type` abaixo é apagado em runtime.

import { createHash } from "node:crypto";
import Parser from "rss-parser";
import { NEWS_SOURCES, sourceFeedUrl } from "./news-sources";
import type { PrismaClient } from "@/generated/prisma/client";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

// Muitos portais devolvem 403 sem um User-Agent de navegador realista.
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
const FETCH_TIMEOUT_MS = 15_000;
const SUMMARY_MAX = 300;
const SLUG_MAX = 80;

// Teto do corpo do feed: acima disso pulamos a fonte (com erro), para um portal
// que devolva um corpo gigante não estourar a memória. ~5 MB cobre com folga
// qualquer feed RSS/Atom real.
const MAX_BODY_BYTES = 5 * 1024 * 1024;

// Fontes buscadas em PARALELO, em um pool com limite. O gargalo é a rede (cada
// fetch tem timeout de 15s); um pool pequeno corta o tempo total de ~minutos
// (25 × 15s em série) para ~o lote mais lento, sem martelar os portais.
const FETCH_POOL_SIZE = 5;

// Marcas diacríticas combinantes (acentos após NFD) — removidas no slug.
const COMBINING_MARKS = /[\u0300-\u036f]/g;

// rss-parser lida com RSS 2.0 e Atom. Mapeamos os campos do namespace Media RSS
// (media:content / media:thumbnail) para capturar imagens quando existirem.
const parser = new Parser({
  timeout: FETCH_TIMEOUT_MS,
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: true }],
    ],
  },
});

// Campos do item de feed que realmente consumimos (rss-parser popula estes).
interface FeedItem {
  title?: string;
  link?: string;
  pubDate?: string;
  isoDate?: string;
  content?: string;
  contentSnippet?: string;
  summary?: string;
  enclosure?: { url?: string; type?: string };
  mediaContent?: unknown;
  mediaThumbnail?: unknown;
}

// ---------------------------------------------------------------------------
// Tipos de retorno
// ---------------------------------------------------------------------------

export interface IngestError {
  source: string;
  message: string;
}

export interface IngestedNews {
  title: string;
  source: string;
  url: string;
  slug: string;
}

export interface IngestSummary {
  sources: number;
  fetched: number;
  inserted: number;
  skipped: number;
  errors: IngestError[];
  /** Amostra das notícias inseridas nesta execução (para log/relatório). */
  inserted_news: IngestedNews[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function errMsg(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === "AbortError" || err.name === "TimeoutError") {
      return `timeout (${FETCH_TIMEOUT_MS / 1000}s)`;
    }
    return err.message;
  }
  return String(err);
}

function codePoint(n: number): string {
  return Number.isFinite(n) && n > 0 ? String.fromCodePoint(n) : " ";
}

/** Remove tags HTML, decodifica entidades comuns e colapsa espaços. */
function stripHtml(input: string): string {
  return input
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&(?:#39|apos);/gi, "'")
    .replace(/&(?:hellip|#8230);/gi, "…")
    .replace(/&#(\d+);/g, (_, dec: string) => codePoint(Number(dec)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => codePoint(parseInt(hex, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

/** Resumo curto e limpo (HTML removido, truncado). */
function buildSummary(item: FeedItem): string {
  const raw = item.contentSnippet || item.summary || item.content || "";
  const clean = stripHtml(String(raw));
  if (clean.length <= SUMMARY_MAX) return clean;
  return clean.slice(0, SUMMARY_MAX - 1).trimEnd() + "…";
}

/** minúsculas, sem acento, só a-z0-9 e hífens. */
function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");
}

function hash6(input: string): string {
  return createHash("sha1").update(input).digest("hex").slice(0, 6);
}

/** Extrai a URL de dentro de um nó media:content/thumbnail (xml2js). */
function pickMediaUrl(node: unknown): string | null {
  const arr = Array.isArray(node) ? node : node ? [node] : [];
  for (const n of arr) {
    if (n && typeof n === "object") {
      const rec = n as Record<string, unknown>;
      const dollar = rec["$"];
      if (dollar && typeof dollar === "object") {
        const u = (dollar as Record<string, unknown>)["url"];
        if (typeof u === "string" && u) return u;
      }
      const u2 = rec["url"];
      if (typeof u2 === "string" && u2) return u2;
    }
  }
  return null;
}

/** Imagem do item: enclosure → media:* → primeira <img> do conteúdo → null. */
function extractImage(item: FeedItem): string | null {
  const enc = item.enclosure;
  if (enc?.url && (!enc.type || enc.type.startsWith("image"))) {
    return enc.url;
  }
  const fromMedia =
    pickMediaUrl(item.mediaContent) ?? pickMediaUrl(item.mediaThumbnail);
  if (fromMedia) return fromMedia;

  const html = String(item.content || item.summary || "");
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (m?.[1]) return m[1];

  return null;
}

/** Data de publicação: pubDate/isoDate, com fallback para agora. */
function parseDate(item: FeedItem): Date {
  const raw = item.isoDate || item.pubDate;
  if (raw) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

async function slugTaken(prisma: PrismaClient, slug: string): Promise<boolean> {
  const found = await prisma.news.findFirst({
    where: { slug },
    select: { id: true },
  });
  return found !== null;
}

/** Garante slug único: se colidir, anexa um sufixo curto derivado da URL. */
async function uniqueSlug(
  prisma: PrismaClient,
  base: string,
  url: string,
): Promise<string> {
  if (!(await slugTaken(prisma, base))) return base;

  let candidate = `${base}-${hash6(url)}`;
  let i = 1;
  while (await slugTaken(prisma, candidate)) {
    candidate = `${base}-${hash6(url)}-${i}`;
    i += 1;
  }
  return candidate;
}

/**
 * Busca o XML do feed com User-Agent de navegador, timeout (AbortController) e
 * TETO de corpo: rejeita/pula corpos acima de MAX_BODY_BYTES. Primeiro confere
 * o Content-Length declarado; como ele pode faltar ou mentir, também lê o corpo
 * em stream acumulando até o teto e aborta se estourar (nunca materializa um
 * corpo gigante inteiro na memória).
 */
async function fetchFeedXml(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": BROWSER_UA,
        Accept:
          "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`.trim());
    }

    // 1) Teto barato pelo Content-Length, quando o servidor o informa.
    const declared = Number(res.headers.get("content-length"));
    if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
      throw new Error(
        `corpo grande demais: ${declared} bytes (teto ${MAX_BODY_BYTES}).`,
      );
    }

    // 2) Teto real lendo em stream (Content-Length pode faltar/mentir).
    const body = res.body;
    if (!body) return await res.text(); // fallback defensivo (sem stream)

    const reader = body.getReader();
    const decoder = new TextDecoder("utf-8");
    let text = "";
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel(); // descarta o resto e libera a conexão
        throw new Error(`corpo excedeu o teto de ${MAX_BODY_BYTES} bytes.`);
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode(); // flush de bytes multibyte pendentes
    return text;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Roda `worker` sobre `items` com no máximo `poolSize` execuções simultâneas
 * (pool de trabalho rolante: cada runner puxa o próximo índice quando termina).
 * `worker` nunca deve lançar — os erros são absorvidos no chamador — então
 * Promise.all aqui não rejeita.
 */
async function runPool<T>(
  items: readonly T[],
  poolSize: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  async function drain(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await worker(items[index]);
    }
  }
  const runners = Array.from({ length: Math.min(poolSize, items.length) }, () =>
    drain(),
  );
  await Promise.all(runners);
}

// ---------------------------------------------------------------------------
// Motor de ingestão
// ---------------------------------------------------------------------------

/**
 * Busca todas as fontes EM PARALELO (pool de FETCH_POOL_SIZE), normaliza os
 * itens e insere as manchetes NOVAS com status "pending". Robusto: uma fonte
 * que falhar (rede/403/parse/corpo grande) não derruba as outras — o erro é
 * acumulado em `errors`. Dedupe por URL do artigo. As escritas no SQLite são
 * serializadas pelo Prisma/adapter, então a concorrência é segura; qualquer
 * corrida de slug entre fontes cai no catch do insert (contada como skip).
 */
export async function ingestNews(prisma: PrismaClient): Promise<IngestSummary> {
  const summary: IngestSummary = {
    sources: NEWS_SOURCES.length,
    fetched: 0,
    inserted: 0,
    skipped: 0,
    errors: [],
    inserted_news: [],
  };

  // Processa UMA fonte de ponta a ponta (fetch → parse → dedupe → insert).
  // Totalmente guardada: nunca lança (some tudo em `summary`).
  async function processSource(
    source: (typeof NEWS_SOURCES)[number],
  ): Promise<void> {
    try {
      const feedUrl = sourceFeedUrl(source);
      const xml = await fetchFeedXml(feedUrl);
      const feed = await parser.parseString(xml);
      summary.fetched += 1;

      for (const raw of feed.items ?? []) {
        const item = raw as FeedItem;
        const title = (item.title ?? "").trim();
        const url = (item.link ?? "").trim();

        // Sem título ou sem link de volta → não guardamos.
        if (!title || !url) {
          summary.skipped += 1;
          continue;
        }

        // Dedupe por URL do artigo original (idempotente entre execuções).
        const existing = await prisma.news.findFirst({ where: { url } });
        if (existing) {
          summary.skipped += 1;
          continue;
        }

        const slug = await uniqueSlug(prisma, slugify(title) || hash6(url), url);

        try {
          await prisma.news.create({
            data: {
              title,
              slug,
              image: extractImage(item),
              source: source.name,
              url,
              summary: buildSummary(item),
              status: "pending",
              publishedAt: parseDate(item),
            },
          });
          summary.inserted += 1;
          if (summary.inserted_news.length < 50) {
            summary.inserted_news.push({
              title,
              source: source.name,
              url,
              slug,
            });
          }
        } catch (err) {
          // Colisão de unique/erro pontual no insert não pode derrubar a fonte.
          summary.skipped += 1;
          summary.errors.push({
            source: source.name,
            message: `insert falhou (${title.slice(0, 60)}): ${errMsg(err)}`,
          });
        }
      }
    } catch (err) {
      summary.errors.push({ source: source.name, message: errMsg(err) });
    }
  }

  await runPool(NEWS_SOURCES, FETCH_POOL_SIZE, processSource);

  return summary;
}
