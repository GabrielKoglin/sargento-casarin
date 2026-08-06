// ============================================================================
// src/lib/news-sources.ts — catálogo de fontes de notícias de Mato Grosso
// ============================================================================
// Agregador de MANCHETES dos portais regionais. Ético/legal: guardamos SÓ o
// título + um resumo curto + o nome da fonte + o LINK de volta ao artigo
// original + a data. Nunca o conteúdo completo.
//
// Dois tipos de fonte:
//   - "rss":   o portal publica um feed RSS/Atom nativo (campo `url`).
//   - "gnews": não há feed nativo confiável; usamos o Google News RSS. Pode ser
//              filtrado por domínio (`domain`, site:, últimos 7 dias) OU por um
//              termo de busca dedicado (`query`, últimos 30 dias). Quando ambos
//              existirem, `query` tem precedência.

export type NewsSourceType = "rss" | "gnews";

export interface NewsSource {
  /** Nome exibido e gravado no campo `source` da notícia. */
  name: string;
  type: NewsSourceType;
  /** Feed nativo — obrigatório quando type === "rss". */
  url?: string;
  /** Domínio do portal — usado quando type === "gnews" (busca `site:domain`). */
  domain?: string;
  /**
   * Termo de busca literal para o Google News. Quando presente numa fonte
   * "gnews", tem PRECEDÊNCIA sobre `domain`: a URL vira uma busca por esse termo
   * (últimos 30 dias) em vez de `site:domain`. Use aspas para frase exata,
   * ex.: '"Sargento Casarin"'.
   */
  query?: string;
}

export const NEWS_SOURCES: NewsSource[] = [
  // --- RSS nativo -----------------------------------------------------------
  { name: "Capital Notícia", type: "rss", url: "https://capitalnoticia.com.br/feed/" },
  { name: "CenárioMT", type: "rss", url: "https://cenariomt.com.br/feed/" },
  { name: "Central de Notícias MT", type: "rss", url: "https://centraldenoticiasmt.com.br/feed/" },
  { name: "MT Post", type: "rss", url: "https://mtpost.com.br/feed/" },
  { name: "Mato Grosso Mil Grau", type: "rss", url: "https://mtmilgrau.com.br/feed.xml" },
  { name: "Mato Grosso Mais Notícias", type: "rss", url: "https://www.matogrossomaisnoticias.com.br/feed/" },
  { name: "PNB Online", type: "rss", url: "https://pnbonline.com.br/feed/" },
  { name: "Só Notícias", type: "rss", url: "https://www.sonoticias.com.br/feed/" },
  { name: "Terra MT Digital", type: "rss", url: "https://terramtdigital.com.br/feed/" },
  { name: "MT Notícias", type: "rss", url: "https://mtnoticias.com/feed/" },
  { name: "MT 24 Horas (política)", type: "rss", url: "https://mt24h.com.br/categoria/politica/feed/" },
  { name: "MT 24 Horas (polícia)", type: "rss", url: "https://mt24h.com.br/categoria/policia/feed/" },
  { name: "G1 Mato Grosso", type: "rss", url: "https://g1.globo.com/dynamo/mato-grosso/rss2.xml" },
  { name: "Leiagora", type: "rss", url: "https://leiagora.com.br/feed/" },
  { name: "Visão Notícias", type: "rss", url: "https://visaonoticias.com.br/feed/" },

  // TODO: "A Folha de Notícias" — domínio ainda a confirmar pelo cliente.
  //       NÃO inventar o domínio; adicionar aqui (type "gnews") quando confirmado.

  // --- Google News: busca DEDICADA por termo (o candidato), últimos 30 dias ---
  // Já vêm super-relevantes; ainda assim o filtro de relevância da ingestão se
  // aplica (defesa dupla). O cliente pode ajustar/expandir estes termos.
  { name: "Google News — Sargento Casarin", type: "gnews", query: '"Sargento Casarin"' },
  { name: "Google News — Dickson Casarin", type: "gnews", query: '"Dickson Casarin"' },

  // --- Google News (busca por domínio, últimos 7 dias) ---------------------
  { name: "Olhar Direto", type: "gnews", domain: "olhardireto.com.br" },
  { name: "MidiaNews", type: "gnews", domain: "midianews.com.br" },
  { name: "Gazeta Digital", type: "gnews", domain: "gazetadigital.com.br" },
  { name: "RDNews", type: "gnews", domain: "rdnews.com.br" },
  { name: "RepórterMT", type: "gnews", domain: "reportermt.com" },
  { name: "FolhaMax", type: "gnews", domain: "folhamax.com" },
  { name: "VG Notícias (VGN)", type: "gnews", domain: "vgnoticias.com.br" },
  { name: "HiperNotícias (HNT)", type: "gnews", domain: "hnt.com.br" },
  { name: "Nortão Online", type: "gnews", domain: "nortaoonline.com" },
  { name: "Estadão Mato Grosso", type: "gnews", domain: "estadaomatogrosso.com.br" },
];

/**
 * Resolve a URL de feed a ser buscada para uma fonte.
 * - rss:   retorna o feed nativo configurado.
 * - gnews: monta a busca do Google News RSS. `query` (busca por termo, últimos
 *          30 dias) tem PRECEDÊNCIA sobre `domain` (busca `site:`, últimos 7 dias).
 */
export function sourceFeedUrl(source: NewsSource): string {
  if (source.type === "gnews") {
    // `query` tem precedência sobre `domain`: busca por termo em vez de site:.
    if (source.query) {
      return `https://news.google.com/rss/search?q=${encodeURIComponent(source.query)}%20when:30d&hl=pt-BR&gl=BR&ceid=BR:pt`;
    }
    if (!source.domain) {
      throw new Error(
        `Fonte gnews "${source.name}" sem \`query\` ou \`domain\` configurado`,
      );
    }
    return `https://news.google.com/rss/search?q=site:${source.domain}%20when:7d&hl=pt-BR&gl=BR&ceid=BR:pt`;
  }
  if (!source.url) {
    throw new Error(`Fonte rss "${source.name}" sem \`url\` configurada`);
  }
  return source.url;
}
