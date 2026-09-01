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

import { createHash, randomUUID } from "node:crypto";
import Parser from "rss-parser";
import sharp from "sharp";
import { NEWS_SOURCES, sourceFeedUrl } from "./news-sources";
// Import RELATIVO (não o alias "@/…"): assim o script tsx da ingestão também
// resolve. storage.ts é puro (só fetch + env), roda em Node.
import { uploadImage } from "./storage";
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

// Resolução de og:image do artigo: timeout próprio (mais curto que o do feed) e
// teto de leitura — a og:image vive no <head>, então lemos só o começo do HTML
// e abortamos (nunca baixamos a página inteira).
// Cobre a CADEIA inteira de resolução da imagem (para o Google News são 3
// requisições em série: interstitial → batchexecute → matéria real).
const IMG_FETCH_TIMEOUT_MS = 20_000;
// Teto de leitura do HTML. Precisa ser generoso: a página do Google News tem um
// <head> ENORME (~590 KB) e coloca a og:image lá no fim dele — um teto apertado
// cortaria a leitura antes de alcançá-la. Em portais normais a og:image vem nos
// primeiros KB e o fechamento do </head> encerra a leitura muito antes disto.
const HEAD_SCAN_BYTES = 2 * 1024 * 1024;
// Largura pedida ao CDN do Google para os thumbnails (o card tem 195px de alt.).
const GOOGLE_THUMB_WIDTH = 640;
// Lado máximo (px) da imagem re-hospedada. 800 basta com folga para o card e
// mantém o objeto leve no storage. WebP q80 (mesma convenção de image-upload).
const REHOST_MAX_SIDE = 800;
const REHOST_WEBP_QUALITY = 80;
// Corpo mínimo aceitável de uma imagem baixada (bytes). Abaixo disso é quase
// sempre um pixel de tracking / página de erro travestida de imagem.
const MIN_IMAGE_BYTES = 512;
// Endpoint interno (não-documentado) que decodifica o link-redirecionador do
// Google News para a URL real do portal. Ver resolveGoogleNewsUrl().
const GNEWS_BATCH_URL =
  "https://news.google.com/_/DotsSplashUi/data/batchexecute";

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
  /**
   * Itens descartados pelo FILTRO DE RELEVÂNCIA (não citam o candidato).
   * Contador separado de `skipped` (que é dedupe/sem-título/erro de insert).
   */
  filtered: number;
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

// ---------------------------------------------------------------------------
// Filtro de relevância
// ---------------------------------------------------------------------------
// Os portais de MT trazem MILHARES de manchetes; só interessam as que citam /
// têm a ver com o candidato. Antes de inserir, normalizamos título+resumo e
// exigimos ao menos um RELEVANCE_TERMS por substring (case + acento-insensível).

/**
 * Termos que tornam uma notícia RELEVANTE para a campanha. Já normalizados
 * (minúsculas, SEM acento). "casarin" como substring já cobre a maioria dos
 * casos. O CLIENTE pode ajustar/expandir esta lista livremente — ex.: adicionar
 * o nome de urna, apelidos ou variações; termos com acento também funcionam
 * (são normalizados no match).
 */
export const RELEVANCE_TERMS = [
  "casarin",
  "dickson casarin",
  "sargento casarin",
  "sgt casarin",
];

/**
 * minúsculas + sem acento (mesmo padrão NFD + COMBINING_MARKS do slugify),
 * porém PRESERVANDO o texto (só colapsa espaços) — para casar termos com espaço
 * como "dickson casarin".
 */
function normalizeForMatch(input: string): string {
  return input
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * true se o título OU o resumo citarem algum RELEVANCE_TERMS (match por
 * SUBSTRING, insensível a maiúsculas/acentos). Exportada para testabilidade.
 */
export function isRelevant(title: string, summary: string): boolean {
  const haystack = normalizeForMatch(`${title} ${summary}`);
  return RELEVANCE_TERMS.some((term) =>
    haystack.includes(normalizeForMatch(term)),
  );
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

/**
 * Aumenta a largura pedida ao CDN de imagens do Google (lh3.googleusercontent…),
 * cujo sufixo `=...` codifica o tamanho (ex.: `=s0-w300-rw`). O card é grande,
 * então pedimos GOOGLE_THUMB_WIDTH. Para outros hosts, retorna a URL intacta.
 */
function upsizeGoogleThumb(url: string): string {
  if (!/googleusercontent\.com/i.test(url)) return url;
  if (/=[-\w]+$/.test(url)) return url.replace(/=[-\w]+$/, `=w${GOOGLE_THUMB_WIDTH}`);
  return `${url}=w${GOOGLE_THUMB_WIDTH}`;
}

/** Primeira og:image / twitter:image / image_src encontrada no HTML. */
function extractOgImage(html: string): string | null {
  const patterns = [
    /<meta[^>]+property=["']og:image(?::secure_url|:url)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url|:url)?["']/i,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i,
    /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

/** true se a URL é um link-redirecionador do Google News (rss/articles/…). */
function isGoogleNewsUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith("news.google.com");
  } catch {
    return false;
  }
}

/**
 * Resolve o link-redirecionador do Google News para a URL REAL do portal.
 *
 * O link do feed (news.google.com/rss/articles/…) NÃO é a matéria: é uma página
 * interstitial que redireciona por JS, e a og:image dela é a MARCA do Google News
 * (a mesma para todas as notícias) — inútil como imagem de card. Para chegar na
 * foto de verdade precisamos da URL do portal.
 *
 * O Google usa um id criptografado: a página interstitial traz assinatura +
 * timestamp + id (data-n-a-sg / -ts / -id) que alimentam a API interna
 * `batchexecute`, que devolve a URL de destino. É API NÃO-DOCUMENTADA (pode mudar
 * sem aviso): a função NUNCA lança — devolve null em qualquer falha, e a chamadora
 * cai no placeholder. Retorna o HTML do interstitial junto (evita rebaixá-lo).
 */
async function resolveGoogleNewsUrl(
  gnewsUrl: string,
  signal: AbortSignal,
): Promise<string | null> {
  const page = await fetch(gnewsUrl, {
    headers: { "User-Agent": BROWSER_UA, "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8" },
    redirect: "follow",
    signal,
  });
  if (!page.ok) return null;
  const html = await page.text();
  const sg = html.match(/data-n-a-sg=["']([^"']+)["']/i)?.[1];
  const ts = html.match(/data-n-a-ts=["']([^"']+)["']/i)?.[1];
  const id = html.match(/data-n-a-id=["']([^"']+)["']/i)?.[1];
  if (!sg || !ts || !id) return null;

  const inner = `["garturlreq",[["X","X",["X","X"],null,null,1,1,"US:en",null,1,null,null,null,null,null,0,1],"X","X",1,[1,1,1],1,1,null,0,0,null,0],"${id}",${ts},"${sg}"]`;
  const payload = JSON.stringify([[["Fbv4je", inner, null, "generic"]]]);
  const res = await fetch(GNEWS_BATCH_URL, {
    method: "POST",
    headers: {
      "User-Agent": BROWSER_UA,
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: "f.req=" + encodeURIComponent(payload),
    signal,
  });
  if (!res.ok) return null;
  const text = await res.text();
  // A resposta é `)]}'` + linhas com JSON aninhado; a URL de destino é a primeira
  // http(s) que NÃO aponta de volta ao próprio Google News.
  const m = text.match(/"(https?:\/\/(?!news\.google\.com)[^"]+)"/);
  if (!m) return null;
  return m[1]
    .replace(/\\u003d/gi, "=")
    .replace(/\\u0026/gi, "&")
    .replace(/\\\//g, "/");
}

/** Baixa a og:image da página em `url` (lê só o <head>). Não lança. */
async function fetchOgImage(url: string, signal: AbortSignal): Promise<string | null> {
  const res = await fetch(url, {
    headers: { "User-Agent": BROWSER_UA, "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8" },
    redirect: "follow",
    signal,
  });
  if (!res.ok || !res.body) return null;
  const ctype = res.headers.get("content-type") ?? "";
  if (ctype && !/text\/html|application\/xhtml/i.test(ctype)) return null;

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let html = "";
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    html += decoder.decode(value, { stream: true });
    // A og:image está no <head>: quando ele fecha (ou batemos no teto), paramos e
    // liberamos a conexão — não faz sentido baixar o <body> inteiro.
    if (total >= HEAD_SCAN_BYTES || /<\/head>/i.test(html)) {
      await reader.cancel();
      break;
    }
  }
  const og = extractOgImage(html);
  return og ? upsizeGoogleThumb(og) : null;
}

/**
 * Resolve a imagem de destaque de um artigo a partir da og:image da matéria.
 * Para links do Google News, primeiro resolve a URL REAL do portal (a og:image do
 * interstitial é só a marca do Google News); para URLs diretas de portais, lê a
 * og:image direto. NUNCA lança: devolve null em qualquer falha (rede/timeout/sem
 * og/decode falhou), para não derrubar a ingestão. Exportada para o backfill.
 */
export async function resolveArticleImage(url: string): Promise<string | null> {
  if (!/^https?:\/\//i.test(url)) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), IMG_FETCH_TIMEOUT_MS);
  try {
    const target = isGoogleNewsUrl(url)
      ? await resolveGoogleNewsUrl(url, controller.signal)
      : url;
    if (!target) return null;
    return await fetchOgImage(target, controller.signal);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Baixa a imagem de origem, otimiza (sharp → WebP) e SOBE ao nosso bucket,
 * devolvendo a URL pública NOSSA. Servir do nosso domínio nos torna imunes ao
 * bloqueio de hotlink e à expiração/troca da imagem no portal (vários portais de
 * MT recusam servir a imagem para outro site). No servidor o download costuma
 * retornar 200 mesmo quando o navegador é bloqueado. NUNCA lança: devolve null em
 * qualquer falha (download/decodificação/upload), e a chamadora decide o fallback.
 * Exportada para o backfill reusar.
 */
export async function rehostImage(srcUrl: string): Promise<string | null> {
  if (!/^https?:\/\//i.test(srcUrl)) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), IMG_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(srcUrl, {
      headers: { "User-Agent": BROWSER_UA, "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8" },
      redirect: "follow",
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const ctype = res.headers.get("content-type") ?? "";
    if (ctype && !/^image\//i.test(ctype)) return null;

    const input = Buffer.from(await res.arrayBuffer());
    if (input.byteLength < MIN_IMAGE_BYTES) return null;

    const output = await sharp(input)
      .rotate() // respeita a orientação EXIF (fotos de celular)
      .resize(REHOST_MAX_SIDE, REHOST_MAX_SIDE, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: REHOST_WEBP_QUALITY })
      .toBuffer();

    return await uploadImage(`news-${randomUUID()}.webp`, output, "image/webp");
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
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
    filtered: 0,
    skipped: 0,
    errors: [],
    inserted_news: [],
  };

  // Processa UMA fonte de ponta a ponta (fetch → parse → dedupe → insert).
  // Totalmente guardada: nunca lança (some tudo em `summary`).
  async function processSource(
    source: (typeof NEWS_SOURCES)[number],
  ): Promise<void> {
    // Fontes com query dedicada (o nome do candidato) já são relevantes por
    // construção — o Google buscou o nome dele. Confiamos na query e pulamos o
    // filtro de relevância (as manchetes do Google News quase nunca trazem o
    // nome no título/resumo, então o filtro por substring descartaria matérias
    // que SÃO sobre ele, ex.: "PT aciona 'sargento blogueiro' em MT").
    const trusted = source.type === "gnews" && Boolean(source.query);

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

        const itemSummary = buildSummary(item);

        // FILTRO DE RELEVÂNCIA: só interessam notícias que citam / têm a ver com
        // o candidato. Fora do tema → descarta (contado em `filtered`, não em
        // `skipped`) e nem consulta o banco. Fontes `trusted` (query dedicada
        // pelo nome dele) pulam o filtro — a query já garante a relevância.
        if (!trusted && !isRelevant(title, itemSummary)) {
          summary.filtered += 1;
          continue;
        }

        // Dedupe por URL do artigo original (idempotente entre execuções).
        const existing = await prisma.news.findFirst({ where: { url } });
        if (existing) {
          summary.skipped += 1;
          continue;
        }

        const slug = await uniqueSlug(prisma, slugify(title) || hash6(url), url);

        // Imagem: primeiro tenta o próprio feed (enclosure/media/<img>); se vier
        // vazio (o caso do Google News), resolve a og:image da página do artigo.
        // Depois RE-HOSPEDA no nosso bucket (imune a bloqueio de hotlink); se o
        // re-host falhar, guarda a URL de origem como fallback.
        const src = extractImage(item) ?? (await resolveArticleImage(url));
        const image = src ? ((await rehostImage(src)) ?? src) : null;

        try {
          await prisma.news.create({
            data: {
              title,
              slug,
              image,
              source: source.name,
              url,
              summary: itemSummary,
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
