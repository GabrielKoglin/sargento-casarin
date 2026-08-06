// ============================================================================
// /api/chat — cérebro do assistente virtual do site (Sargento Casarin)
// ============================================================================
// Dois modos, transparentes para o widget:
//   1) SEM chave (ANTHROPIC_API_KEY ausente): responde por CONTEÚDO CURADO —
//      casa a intenção da pergunta com respostas seguras e pré-aprovadas.
//      Zero custo, zero alucinação — ideal e seguro para um site de campanha.
//   2) COM chave: usa o Claude (Haiku) com um system prompt RÍGIDO, ancorado
//      só nas informações oficiais + guarda-corpos (não inventa posições, não
//      faz promessas, não fala de adversários, redireciona o que não sabe).
//
// A resposta é SEMPRE um stream de texto (text/plain), então o widget consome
// igual nos dois modos. Runtime Node (usa fetch para a API da Anthropic).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Msg = { role: "user" | "assistant"; content: string };

const MAX_MESSAGES = 16; // histórico máximo aceito (anti-abuso)
const MAX_CHARS = 1500; // tamanho máximo de cada mensagem

// ---------------------------------------------------------------------------
// Rate-limit best-effort POR IP (espelha src/app/actions.ts): endpoint público
// e, COM ANTHROPIC_API_KEY, cada requisição pode custar créditos. Map em memória
// com janela deslizante; só limita quando há um IP real (x-forwarded-for ->
// x-real-ip) — sem IP confiável preferimos permitir a bloquear todo mundo num
// balde único. Store por instância (não compartilhado): mitigação, não muralha.
// ---------------------------------------------------------------------------
const CHAT_RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto
const CHAT_RATE_LIMIT_MAX = 20; // ~20 req/min por IP
const CHAT_RATE_LIMIT_PRUNE_THRESHOLD = 1000;
const chatAttempts = new Map<string, number[]>();

// Varredura leve: descarta tentativas fora da janela e remove IPs ociosos. Só é
// chamada quando o Map cresce, para não pagar a limpeza em toda requisição.
function pruneExpiredChatAttempts(windowStart: number): void {
  for (const [key, attempts] of chatAttempts) {
    const recent = attempts.filter((attempt) => attempt > windowStart);
    if (recent.length === 0) {
      chatAttempts.delete(key);
    } else if (recent.length !== attempts.length) {
      chatAttempts.set(key, recent);
    }
  }
}

function isChatRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - CHAT_RATE_LIMIT_WINDOW_MS;

  if (chatAttempts.size > CHAT_RATE_LIMIT_PRUNE_THRESHOLD) {
    pruneExpiredChatAttempts(windowStart);
  }

  const attempts = (chatAttempts.get(ip) ?? []).filter(
    (attempt) => attempt > windowStart,
  );

  if (attempts.length >= CHAT_RATE_LIMIT_MAX) {
    chatAttempts.set(ip, attempts);
    return true;
  }

  attempts.push(now);
  chatAttempts.set(ip, attempts);
  return false;
}

// IP em cadeia: primeiro salto de x-forwarded-for, senão x-real-ip. Sem um IP
// real devolvemos null (não usamos uma string literal como chave — viraria um
// balde único compartilhado por todos os visitantes).
function resolveChatIp(req: Request): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    null
  );
}

// Barra POST cross-site (sequestro de custo da IA a partir de OUTROS sites). O
// widget do próprio site sempre envia um POST same-origin. Estratégia:
//   1) sec-fetch-site (enviado por navegadores modernos): "same-origin"/
//      "same-site"/"none" são OK; só "cross-site" é bloqueado.
//   2) Fallback pelo header `origin`: compara seu host com o host da request.
// Sem NENHUM dos dois (ex.: curl, navegação direta) NÃO afirmamos cross-site e
// deixamos passar — o rate-limit e o modo curado seguem valendo como defesa.
function isCrossSiteRequest(req: Request): boolean {
  const secFetchSite = req.headers.get("sec-fetch-site");
  if (secFetchSite) {
    return secFetchSite === "cross-site";
  }

  const origin = req.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host !== req.headers.get("host");
    } catch {
      return true; // origin malformado → trata como cross-site
    }
  }

  return false;
}

// ---------------------------------------------------------------------------
// Fatos oficiais — ÚNICA fonte de verdade do assistente (curado + LLM).
// Editar aqui para atualizar o que a IA "sabe". NÃO inventar nada além disto.
// ---------------------------------------------------------------------------
const CANDIDATE_CONTEXT = `
Sobre o candidato:
- Dickson "Sargento" Casarin, candidato a Deputado Estadual por Mato Grosso (eleições 2026).
- Sargento da Polícia Militar de MT, 15 anos na linha de frente da segurança pública, incluindo a ROTAM (tropa de elite).
- Bordão/tom: linha de frente, disciplina, respeito às famílias mato-grossenses. "Ninguém aguenta mais" (manifesto).

Eixos de atuação (propostas):
- Segurança Pública em primeiro lugar: mais estrutura, tecnologia e efetivo, com quem conhece a linha de frente.
- Valorização dos profissionais de segurança: respeito, boas condições de trabalho e amparo à família.
- Educação com disciplina e valores: escola que forma cidadãos de caráter, civismo e respeito à família.
- Mato Grosso forte e desenvolvido: defender quem vive, trabalha e produz no estado.

Como participar / ajudar:
- Grupos oficiais no WhatsApp por região (Cuiabá, Várzea Grande, Rondonópolis, Sinop e outras): página /tropa ("Nossos Grupos").
- Apoiar: divulgar as propostas, ser voluntário, enviar ideias — página /ajudar. Doações seguem a legislação eleitoral, pela plataforma oficial apoiar.me/sargentocasarin.
- Redes sociais oficiais: @sargentocasarin (Instagram, Facebook, Threads, TikTok).
- Contato com a equipe: página /contato. Agenda de eventos: /agenda. Notícias: /noticias. Trajetória: /sobre.
`.trim();

const SYSTEM_PROMPT = `Você é o ASSISTENTE VIRTUAL do site oficial de campanha do Sargento Dickson Casarin. Fale em português do Brasil, de forma calorosa, breve e clara (2 a 5 frases). Você NÃO é o candidato — nunca se passe por ele; fale sempre na terceira pessoa ("o Sargento Casarin defende...").

REGRAS (obrigatórias):
- Responda SOMENTE com base nas informações oficiais abaixo. Se não souber ou não estiver na lista, diga com sinceridade que não tem essa informação e direcione para os canais oficiais (/contato, ou os grupos em /tropa).
- NUNCA invente propostas, números, datas, promessas ou posições que não estejam no contexto. Não prometa nada em nome do candidato.
- NÃO opine sobre outros candidatos, partidos, ou temas polêmicos fora da campanha. Se provocado, redirecione com cordialidade para as propostas do Casarin.
- Sobre doações: apenas informe que seguem a legislação eleitoral, pela plataforma oficial apoiar.me/sargentocasarin. Não incentive de forma agressiva.
- Incentive, quando fizer sentido, a pessoa a entrar nos grupos (/tropa) ou conhecer as propostas (/propostas).
- Acessibilidade: seja simples e direto; evite jargões.

INFORMAÇÕES OFICIAIS:
${CANDIDATE_CONTEXT}`;

// ---------------------------------------------------------------------------
// Modo curado (sem chave): casa palavras-chave da última pergunta a respostas
// seguras. Acento/caixa ignorados. Sempre retorna algo útil.
// ---------------------------------------------------------------------------
function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

const CURATED: { keys: string[]; answer: string }[] = [
  {
    keys: ["ola", "oi", "bom dia", "boa tarde", "boa noite", "tudo bem", "eae", "opa"],
    answer:
      "Olá! 👋 Sou o assistente do Sargento Casarin. Posso te contar sobre as propostas, a trajetória dele, a agenda, como participar dos grupos ou como ajudar a campanha. O que você quer saber?",
  },
  {
    keys: ["proposta", "defende", "eixo", "plano", "bandeira", "ideia", "vai fazer"],
    answer:
      "O Sargento Casarin tem quatro eixos: (1) Segurança Pública em primeiro lugar — mais estrutura, tecnologia e efetivo; (2) Valorização dos profissionais de segurança; (3) Educação com disciplina e valores; (4) Mato Grosso forte e desenvolvido. Você pode ver os detalhes em /propostas.",
  },
  {
    keys: ["seguranca", "policia", "crime", "violencia", "rotam", "farda"],
    answer:
      "Segurança pública é a prioridade do Sargento Casarin — são 15 anos na linha de frente, incluindo a ROTAM. A proposta é mais estrutura, tecnologia e efetivo, além de valorizar quem veste a farda. Veja mais em /propostas.",
  },
  {
    keys: ["ajudar", "apoiar", "voluntario", "colaborar", "participar", "contribuir", "engajar"],
    answer:
      "Que ótimo! 💪 Você pode divulgar as propostas, ser voluntário e enviar ideias — tudo em /ajudar. E o principal: entrar nos grupos oficiais por região em /tropa.",
  },
  {
    keys: ["doar", "doacao", "dinheiro", "contribuicao financeira", "apoiar.me", "pix"],
    answer:
      "As contribuições seguem a legislação eleitoral e são feitas exclusivamente pela plataforma oficial: apoiar.me/sargentocasarin. Desconfie de qualquer pedido de dinheiro fora desse canal.",
  },
  {
    keys: ["grupo", "whatsapp", "tropa", "zap", "entrar", "regiao", "cidade"],
    answer:
      "A mobilização acontece no WhatsApp! Escolha a sua cidade ou região e entre no grupo oficial em /tropa (Cuiabá, Várzea Grande, Rondonópolis, Sinop e outras).",
  },
  {
    keys: ["agenda", "evento", "quando", "onde vai estar", "comicio", "mobilizacao"],
    answer:
      "A agenda de eventos e mobilizações fica sempre atualizada em /agenda. Passa lá pra acompanhar e participar!",
  },
  {
    keys: ["quem e", "quem é", "historia", "trajetoria", "sobre ele", "biografia", "carreira"],
    answer:
      "Dickson Casarin é Sargento da Polícia Militar de Mato Grosso, com 15 anos de serviço na segurança pública, incluindo a ROTAM. Agora se candidata a Deputado Estadual para levar a experiência da linha de frente à Assembleia. A trajetória completa está em /sobre.",
  },
  {
    keys: ["rede", "instagram", "facebook", "tiktok", "threads", "midia", "seguir", "perfil"],
    answer:
      "Siga o Sargento Casarin nas redes como @sargentocasarin (Instagram, Facebook, Threads e TikTok). Os links estão na página /midias e no rodapé do site.",
  },
  {
    keys: ["contato", "falar", "email", "e-mail", "equipe", "telefone", "atendimento"],
    answer:
      "Para falar com a equipe, use a página /contato. Se preferir, entre num dos grupos oficiais em /tropa — a mobilização é por lá.",
  },
  {
    keys: ["obrigado", "valeu", "vlw", "agradeco", "gratidao"],
    answer:
      "Por nada! 🙌 Qualquer coisa é só chamar. Vamos juntos por um Mato Grosso mais seguro!",
  },
];

const CURATED_FALLBACK =
  "Boa pergunta! Não tenho essa informação específica por aqui. O melhor caminho é falar com a equipe em /contato ou entrar num dos grupos oficiais em /tropa. Posso te ajudar com as propostas, a trajetória do Casarin, a agenda ou como participar. 😊";

function curatedAnswer(question: string): string {
  const q = normalize(question);
  let best: { score: number; answer: string } | null = null;
  for (const item of CURATED) {
    const score = item.keys.reduce((n, k) => (q.includes(normalize(k)) ? n + 1 : n), 0);
    if (score > 0 && (!best || score > best.score)) best = { score, answer: item.answer };
  }
  return best ? best.answer : CURATED_FALLBACK;
}

// Empacota um texto pronto como stream de texto (para o widget consumir igual
// ao modo LLM). Envia em pedaços pequenos para dar sensação de "digitando".
function streamText(text: string): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const words = text.split(/(\s+)/);
      for (const w of words) controller.enqueue(encoder.encode(w));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
export async function POST(req: Request): Promise<Response> {
  // Barra POST cross-site (evita sequestro de custo da IA a partir de OUTROS
  // sites). O widget do próprio site sempre envia um POST same-origin.
  if (isCrossSiteRequest(req)) {
    return new Response("Origem não autorizada.", { status: 403 });
  }

  // Rate-limit por IP (best-effort). Ao exceder, responde uma mensagem amigável
  // como stream de texto — o widget consome igual a qualquer resposta.
  const ip = resolveChatIp(req);
  if (ip && isChatRateLimited(ip)) {
    return streamText("Muitas mensagens em pouco tempo, aguarde um instante.");
  }

  let messages: Msg[] = [];
  try {
    const body = (await req.json()) as { messages?: unknown };
    if (Array.isArray(body.messages)) {
      messages = body.messages
        .filter(
          (m): m is Msg =>
            !!m &&
            typeof m === "object" &&
            (m as Msg).role !== undefined &&
            typeof (m as Msg).content === "string",
        )
        .slice(-MAX_MESSAGES)
        .map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: String(m.content).slice(0, MAX_CHARS),
        }));
    }
  } catch {
    return streamText("Desculpe, não consegui entender a mensagem. Pode repetir?");
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  if (!lastUser.trim()) {
    return streamText(
      "Oi! Sou o assistente do Sargento Casarin. Pergunte sobre as propostas, a trajetória, a agenda ou como participar. 😊",
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // --- MODO CURADO (sem chave): seguro e sem custo. ---
  if (!apiKey) {
    return streamText(curatedAnswer(lastUser));
  }

  // --- MODO IA (com chave): Claude Haiku, ancorado + guarda-corpos. ---
  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        stream: true,
      }),
    });

    if (!upstream.ok || !upstream.body) {
      // Falha na API (chave inválida, cota, rede): cai no curado, sem quebrar.
      console.error("Falha na API da Anthropic:", upstream.status);
      return streamText(curatedAnswer(lastUser));
    }

    // Reencaminha só o TEXTO dos deltas do SSE da Anthropic como text/plain.
    const encoder = new TextEncoder();
    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    const stream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") continue;
          try {
            const evt = JSON.parse(payload) as {
              type?: string;
              delta?: { type?: string; text?: string };
            };
            if (evt.type === "content_block_delta" && evt.delta?.text) {
              controller.enqueue(encoder.encode(evt.delta.text));
            }
          } catch {
            // linha SSE parcial/keep-alive — ignora.
          }
        }
      },
      cancel() {
        reader.cancel().catch(() => {});
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Erro no /api/chat:", error);
    return streamText(curatedAnswer(lastUser));
  }
}
