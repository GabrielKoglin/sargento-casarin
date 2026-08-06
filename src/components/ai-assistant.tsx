"use client";

// ============================================================================
// src/components/ai-assistant.tsx — Assistente Virtual do Sargento Casarin
// ============================================================================
// FAB (canto inferior direito, substitui o botão do WhatsApp) que abre um chat
// acessível com o assistente de IA do site. Fala com POST /api/chat, que devolve
// um STREAM de texto puro (text/plain) — lido com getReader()+TextDecoder e
// anexado à bolha do assistente conforme chega (efeito "digitando").
//
// Acessibilidade é o foco: role="dialog"/aria-modal, gestão e trap de foco, Esc
// fecha e devolve o foco ao FAB, region role="log" aria-live="polite", ler as
// respostas em voz alta (speechSynthesis, pt-BR) e ditar a pergunta por voz
// (SpeechRecognition, pt-BR — escondido se indisponível). 100% teclado.
//
// SSR-safe / sem flash: `mounted` começa false → SSR e 1º render no cliente
// devolvem null (sem mismatch). Só depois de montar, dentro do useEffect (único
// lugar que toca window), decidimos exibir. Estilos 100% inline. O anel de foco
// visível vem do :focus-visible global (amarelo da marca) — nada é só por cor.

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

type Msg = { role: "user" | "assistant"; content: string };

// --- Tipos mínimos da Web Speech API (não fazem parte do lib.dom padrão) ------
interface SRAlternative {
  readonly transcript: string;
}
interface SRResult {
  readonly length: number;
  readonly isFinal: boolean;
  readonly [index: number]: SRAlternative;
}
interface SRResultList {
  readonly length: number;
  readonly [index: number]: SRResult;
}
interface SREvent {
  readonly resultIndex: number;
  readonly results: SRResultList;
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SREvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
type SRConstructor = new () => SpeechRecognitionLike;

// --- Conteúdo inicial ---------------------------------------------------------
const WELCOME =
  "Olá! 👋 Sou o assistente virtual do Sargento Casarin. Posso falar sobre as propostas, a trajetória dele, a agenda e como participar. Como posso ajudar?";

// Pool de sugestões que reaparece DEPOIS de cada resposta (a conversa não morre).
const SUGGESTION_POOL = [
  "O que o Casarin defende?",
  "Como faço parte?",
  "Como posso ajudar?",
  "Qual é a agenda?",
  "Quem é o Casarin?",
  "Quais as redes sociais?",
  "Como falo com a equipe?",
  "Sobre segurança pública",
];

// Atalhos fixos para as páginas do site (faixa de ações rápidas, sempre visível).
const QUICK_ACTIONS: { label: string; href: string; icon: string }[] = [
  { label: "Nossos Grupos", href: "/tropa", icon: "👥" },
  { label: "Quero Ajudar", href: "/ajudar", icon: "🤝" },
  { label: "Quem é o Casarin", href: "/sobre", icon: "🎖️" },
  { label: "Propostas", href: "/propostas", icon: "📋" },
  { label: "Redes sociais", href: "/midias", icon: "📱" },
  { label: "Agenda", href: "/agenda", icon: "🗓️" },
  { label: "Contato", href: "/contato", icon: "✉️" },
];

// Escala de fonte (%) — persistida em localStorage["a11y-fontscale"].
const FONT_MIN = 87.5;
const FONT_MAX = 150;
const FONT_STEP = 12.5;
const clampScale = (n: number) =>
  Math.min(FONT_MAX, Math.max(FONT_MIN, Math.round(n / FONT_STEP) * FONT_STEP));

const ERROR_MSG =
  "Ops! Não consegui responder agora. Tente de novo em instantes ou fale com a equipe pela página de contato.";

// Mantém o histórico enviado à API começando por uma mensagem do usuário
// (a saudação inicial do assistente é só visual e não vai para o modelo).
function toPayload(history: Msg[]): Msg[] {
  const copy = [...history];
  while (copy.length && copy[0].role === "assistant") copy.shift();
  return copy;
}

// --- Linkificação das respostas ---------------------------------------------
// Reconhece rotas internas (/tropa, /ajudar, …), a plataforma de doação
// (apoiar.me/…) e o @ das redes (@sargentocasarin → /midias) no texto puro do
// assistente e as transforma em links clicáveis, preservando o resto do texto.
const ROUTES =
  "tropa|ajudar|propostas|sobre|agenda|contato|midias|noticias|manifesto|galeria|privacidade|termos|cookies|lgpd|regras";
const RICH_TOKEN = new RegExp(
  `(\\/(?:${ROUTES})(?:\\/[a-z0-9-]+)*|apoiar\\.me\\/[A-Za-z0-9_/-]+|@sargentocasarin)`,
  "g",
);
const INTERNAL_RE = new RegExp(`^\\/(?:${ROUTES})(?:\\/[a-z0-9-]+)*$`);
const APOIAR_RE = /^apoiar\.me\/[A-Za-z0-9_/-]+$/;

const richLinkStyle: CSSProperties = {
  color: "#8ff0b6",
  textDecoration: "underline",
  fontWeight: 600,
};

function renderRich(text: string): ReactNode[] {
  return text.split(RICH_TOKEN).map((part, i) => {
    if (!part) return null;
    if (part === "@sargentocasarin") {
      return (
        <Link key={i} href="/midias" style={richLinkStyle}>
          {part}
        </Link>
      );
    }
    if (APOIAR_RE.test(part)) {
      return (
        <a
          key={i}
          href={`https://${part}`}
          target="_blank"
          rel="noopener noreferrer"
          style={richLinkStyle}
        >
          {part}
        </a>
      );
    }
    if (INTERNAL_RE.test(part)) {
      return (
        <Link key={i} href={part} style={richLinkStyle}>
          {part}
        </Link>
      );
    }
    return part;
  });
}

// Escolhe até 4 sugestões variadas (rotação por turno), pulando a última pergunta.
function pickSuggestions(lastQuestion: string, offset: number): string[] {
  const norm = (s: string) =>
    s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  const lq = norm(lastQuestion);
  const pool = SUGGESTION_POOL.filter((p) => norm(p) !== lq);
  const out: string[] = [];
  for (let i = 0; i < pool.length && out.length < 4; i += 1) {
    out.push(pool[(offset + i) % pool.length]);
  }
  return out;
}

export function AiAssistant() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [sttSupported, setSttSupported] = useState(false);

  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: WELCOME },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [listening, setListening] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [fontScale, setFontScale] = useState(100);
  const [highContrast, setHighContrast] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Montagem (só cliente): media queries + detecção das APIs de voz. Os setState
  // moram em funções nomeadas (padrão do cookie-consent) p/ não disparar o lint
  // react-hooks/set-state-in-effect.
  useEffect(() => {
    const narrowMq = window.matchMedia("(max-width: 640px)");
    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncNarrow = () => setIsNarrow(narrowMq.matches);
    const syncMotion = () => setReduceMotion(motionMq.matches);
    narrowMq.addEventListener("change", syncNarrow);
    motionMq.addEventListener("change", syncMotion);
    syncNarrow();
    syncMotion();

    const w = window as unknown as {
      SpeechRecognition?: SRConstructor;
      webkitSpeechRecognition?: SRConstructor;
    };
    const detect = () => {
      setTtsSupported(typeof window.speechSynthesis !== "undefined");
      setSttSupported(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
      setMounted(true);
    };
    detect();

    return () => {
      narrowMq.removeEventListener("change", syncNarrow);
      motionMq.removeEventListener("change", syncMotion);
      try {
        window.speechSynthesis?.cancel();
      } catch {
        // best-effort
      }
    };
  }, []);

  // Preferências de acessibilidade persistidas (fonte + alto contraste). Lê e
  // reaplica no mount; os setState moram em função nomeada (lint-safe). window/
  // document/localStorage só aqui (SSR-safe).
  useEffect(() => {
    const applyA11y = () => {
      let scale = 100;
      let contrast = false;
      try {
        const savedScale = window.localStorage.getItem("a11y-fontscale");
        if (savedScale) {
          const n = parseFloat(savedScale);
          if (!Number.isNaN(n)) scale = clampScale(n);
        }
        contrast = window.localStorage.getItem("a11y-contrast") === "on";
      } catch {
        // localStorage indisponível (modo privado): mantém padrões.
      }
      if (scale !== 100) document.documentElement.style.fontSize = `${scale}%`;
      document.documentElement.classList.toggle("a11y-contrast", contrast);
      setFontScale(scale);
      setHighContrast(contrast);
    };
    applyA11y();
  }, []);

  // Fecha o painel: para voz/leitura, cancela a requisição em curso e devolve o
  // foco ao FAB. Estável (só setters e refs) → seguro nas deps dos efeitos.
  const close = useCallback(() => {
    setOpen(false);
    try {
      window.speechSynthesis?.cancel();
    } catch {
      // best-effort
    }
    setSpeakingIdx(null);
    try {
      recognitionRef.current?.abort();
    } catch {
      // best-effort
    }
    setListening(false);
    abortRef.current?.abort();
    fabRef.current?.focus();
  }, []);

  // Ao abrir: foca o campo de texto (após o painel entrar no DOM).
  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  // Esc fecha; Tab fica preso dentro do painel (trap de foco).
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open, close]);

  // Auto-scroll da conversa para o fim quando entra conteúdo novo (sem setState).
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  // ---- Envio + consumo do stream de texto do /api/chat ----------------------
  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    // Mantém a saudação + as últimas trocas (limite visual/anti-abuso).
    const base = messages.slice(-24);
    const history: Msg[] = [...base, { role: "user", content: trimmed }];
    const assistantIndex = history.length; // bolha do assistente que será preenchida
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const writeAssistant = (content: string) =>
      setMessages((prev) => {
        const copy = [...prev];
        copy[assistantIndex] = { role: "assistant", content };
        return copy;
      });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: toPayload(history) }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error("resposta inválida");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        writeAssistant(acc);
      }
      acc += decoder.decode();
      writeAssistant(acc || "…");
    } catch (err) {
      // Fechou/cancelou no meio: não sobrescreve com erro.
      if (err instanceof DOMException && err.name === "AbortError") return;
      writeAssistant(ERROR_MSG);
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  // ---- Leitura em voz alta (TTS) --------------------------------------------
  const stopSpeaking = useCallback(() => {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      // best-effort
    }
    setSpeakingIdx(null);
  }, []);

  const speak = (text: string, idx: number) => {
    if (!ttsSupported) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "pt-BR";
      utter.rate = 1;
      utter.onend = () => setSpeakingIdx(null);
      utter.onerror = () => setSpeakingIdx(null);
      setSpeakingIdx(idx);
      window.speechSynthesis.speak(utter);
    } catch {
      setSpeakingIdx(null);
    }
  };

  // ---- Ditado por voz (STT) --------------------------------------------------
  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // best-effort
    }
    setListening(false);
  }, []);

  const startListening = () => {
    if (!sttSupported) return;
    const w = window as unknown as {
      SpeechRecognition?: SRConstructor;
      webkitSpeechRecognition?: SRConstructor;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;
    try {
      const rec = new Ctor();
      rec.lang = "pt-BR";
      rec.interimResults = true;
      rec.continuous = false;
      rec.maxAlternatives = 1;
      rec.onresult = (e: SREvent) => {
        let transcript = "";
        for (let i = e.resultIndex; i < e.results.length; i += 1) {
          transcript += e.results[i][0].transcript;
        }
        setInput(transcript);
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => setListening(false);
      recognitionRef.current = rec;
      setListening(true);
      rec.start();
    } catch {
      setListening(false);
    }
  };

  const onInputKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  // ---- Acessibilidade: tamanho de fonte + alto contraste (persistidos) -------
  const changeFont = (dir: -1 | 0 | 1) => {
    const next = dir === 0 ? 100 : clampScale(fontScale + dir * FONT_STEP);
    document.documentElement.style.fontSize = `${next}%`;
    try {
      window.localStorage.setItem("a11y-fontscale", String(next));
    } catch {
      // best-effort
    }
    setFontScale(next);
  };

  const toggleContrast = () => {
    const next = !highContrast;
    document.documentElement.classList.toggle("a11y-contrast", next);
    try {
      window.localStorage.setItem("a11y-contrast", next ? "on" : "off");
    } catch {
      // best-effort
    }
    setHighContrast(next);
  };

  // Sem flash no SSR: nada até montar no cliente.
  if (!mounted) return null;

  const motion = (css: string) => (reduceMotion ? "none" : css);
  const lastIndex = messages.length - 1;

  // ---- Estilos (inline) ------------------------------------------------------
  const fabStyle: CSSProperties = {
    position: "fixed",
    right: isNarrow ? "1rem" : "1.5rem",
    bottom: isNarrow ? "1rem" : "1.5rem",
    zIndex: 10001,
    width: 60,
    height: 60,
    borderRadius: "50%",
    background: "#00b84b",
    color: "#04111f",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 26px rgba(0,184,75,.45)",
    cursor: "pointer",
    transition: motion("transform .2s ease, box-shadow .2s ease"),
  };

  const panelStyle: CSSProperties = {
    position: "fixed",
    zIndex: 10000,
    background: "#04111f",
    color: "#e6edf3",
    border: "1px solid rgba(0,184,75,.35)",
    boxShadow: "0 24px 64px rgba(0,0,0,.6)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxSizing: "border-box",
    ...(isNarrow
      ? {
          left: "0.5rem",
          right: "0.5rem",
          bottom: "0.5rem",
          top: "0.5rem",
          borderRadius: 16,
        }
      : {
          right: "1.5rem",
          bottom: "6.25rem",
          width: 384,
          height: "min(620px, calc(100vh - 9rem))",
          borderRadius: 16,
        }),
    opacity: 1,
  };

  const headerStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.85rem 1rem",
    background: "#071b2e",
    borderBottom: "1px solid rgba(0,184,75,.25)",
    flexShrink: 0,
  };

  const logStyle: CSSProperties = {
    flex: 1,
    overflowY: "auto",
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    background: "#04111f",
  };

  const bubbleBase: CSSProperties = {
    maxWidth: "85%",
    padding: "0.6rem 0.8rem",
    borderRadius: 12,
    fontSize: "0.92rem",
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  };

  const userBubble: CSSProperties = {
    ...bubbleBase,
    alignSelf: "flex-end",
    background: "#00b84b",
    color: "#04111f",
    borderBottomRightRadius: 3,
    fontWeight: 500,
  };

  const botBubble: CSSProperties = {
    ...bubbleBase,
    alignSelf: "flex-start",
    background: "#0e2536",
    color: "#e6edf3",
    border: "1px solid rgba(255,255,255,.08)",
    borderBottomLeftRadius: 3,
  };

  const chipsWrap: CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.4rem",
    marginTop: "0.15rem",
  };

  const chipStyle: CSSProperties = {
    padding: "0.4rem 0.7rem",
    borderRadius: 999,
    border: "1px solid rgba(0,184,75,.5)",
    background: "transparent",
    color: "#8ff0b6",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: streaming ? "not-allowed" : "pointer",
    opacity: streaming ? 0.5 : 1,
  };

  const ttsBtn: CSSProperties = {
    marginTop: "0.4rem",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3rem",
    padding: "0.25rem 0.55rem",
    borderRadius: 7,
    border: "1px solid rgba(255,255,255,.2)",
    background: "transparent",
    color: "#cfe8d8",
    fontSize: "0.72rem",
    fontWeight: 600,
    cursor: "pointer",
  };

  const footerStyle: CSSProperties = {
    flexShrink: 0,
    padding: "0.6rem",
    borderTop: "1px solid rgba(0,184,75,.25)",
    background: "#071b2e",
    display: "flex",
    alignItems: "flex-end",
    gap: "0.4rem",
  };

  const textareaStyle: CSSProperties = {
    flex: 1,
    resize: "none",
    minHeight: 44,
    maxHeight: 120,
    padding: "0.6rem 0.7rem",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,.18)",
    background: "#04111f",
    color: "#e6edf3",
    fontSize: "0.92rem",
    lineHeight: 1.4,
    fontFamily: "inherit",
  };

  const iconBtn = (active: boolean, disabled: boolean): CSSProperties => ({
    flexShrink: 0,
    width: 44,
    height: 44,
    borderRadius: 10,
    border: active ? "1px solid #00b84b" : "1px solid rgba(255,255,255,.18)",
    background: active ? "rgba(0,184,75,.18)" : "transparent",
    color: active ? "#00b84b" : "#cfe8d8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
  });

  const sendBtnStyle: CSSProperties = {
    flexShrink: 0,
    width: 44,
    height: 44,
    borderRadius: 10,
    border: "none",
    background: "#00b84b",
    color: "#04111f",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: streaming || !input.trim() ? "not-allowed" : "pointer",
    opacity: streaming || !input.trim() ? 0.5 : 1,
  };

  const srOnly: CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0,0,0,0)",
    whiteSpace: "nowrap",
    border: 0,
  };

  const dotStyle = (delay: string): CSSProperties => ({
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#00b84b",
    display: "inline-block",
    animation: reduceMotion ? "none" : `aiTypingBlink 1s ${delay} infinite ease-in-out`,
  });

  const quickWrap: CSSProperties = {
    flexShrink: 0,
    display: "flex",
    gap: "0.4rem",
    padding: "0.5rem 0.75rem",
    overflowX: "auto",
    background: "#04111f",
    borderBottom: "1px solid rgba(0,184,75,.14)",
  };

  const quickChip: CSSProperties = {
    flexShrink: 0,
    whiteSpace: "nowrap",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
    padding: "0.5rem 0.8rem",
    minHeight: 40,
    boxSizing: "border-box",
    borderRadius: 999,
    border: "1px solid rgba(0,184,75,.45)",
    background: "rgba(0,184,75,.12)",
    color: "#d7f5e3",
    fontSize: "0.78rem",
    fontWeight: 600,
    textDecoration: "none",
  };

  const a11yBarStyle: CSSProperties = {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    flexWrap: "wrap",
    padding: "0.5rem 0.75rem",
    background: "#061826",
    borderBottom: "1px solid rgba(0,184,75,.18)",
  };

  const a11yBtn = (active: boolean, disabled: boolean): CSSProperties => ({
    minWidth: 40,
    height: 40,
    padding: "0 0.6rem",
    borderRadius: 8,
    border: active ? "1px solid #00b84b" : "1px solid rgba(255,255,255,.22)",
    background: active ? "rgba(0,184,75,.2)" : "transparent",
    color: active ? "#00b84b" : "#e6edf3",
    fontSize: "0.82rem",
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.2rem",
    flexShrink: 0,
  });

  // Sugestões DEPOIS de cada resposta: só quando o assistente terminou de falar
  // e a última mensagem é dele (inclui a saudação inicial). Varia por turno.
  const lastMsg = messages[lastIndex];
  const canSuggest =
    !streaming && lastMsg?.role === "assistant" && lastMsg.content.trim() !== "";
  const lastUserQuestion =
    [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const userTurns = messages.filter((m) => m.role === "user").length;
  const suggestions = pickSuggestions(lastUserQuestion, userTurns);

  return (
    <>
      {/* Keyframes locais (não editam o globals.css) para os pontos de "digitando". */}
      <style>{"@keyframes aiTypingBlink{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}"}</style>

      {/* -------- FAB (abre/fecha) -------- */}
      <button
        ref={fabRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-label={open ? "Fechar assistente virtual" : "Abrir assistente virtual"}
        aria-expanded={open}
        aria-haspopup="dialog"
        style={fabStyle}
      >
        {open ? (
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
            {/* balão de chat com faísca */}
            <path
              d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H9l-4 3.5V16H5.5A1.5 1.5 0 0 1 4 14.5z"
              fill="currentColor"
            />
            <path
              d="M13.4 7.1l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z"
              fill="#04111f"
            />
          </svg>
        )}
      </button>

      {/* -------- Painel de chat -------- */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Assistente virtual do Sargento Casarin"
          style={panelStyle}
        >
          {/* Cabeçalho */}
          <div style={headerStyle}>
            <span
              aria-hidden="true"
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "#00b84b",
                color: "#04111f",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H9l-4 3.5V16H5.5A1.5 1.5 0 0 1 4 14.5z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ display: "block", fontSize: "0.95rem", color: "#fff" }}>
                Assistente Casarin
              </strong>
              <span style={{ fontSize: "0.72rem", color: "#9fb4c4" }}>
                Tire suas dúvidas sobre a campanha
              </span>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Fechar assistente virtual"
              style={{
                flexShrink: 0,
                width: 40,
                height: 40,
                borderRadius: 8,
                border: "none",
                background: "transparent",
                color: "#cfe8d8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* Barra de acessibilidade: tamanho de fonte + alto contraste (persistidos) */}
          <div role="group" aria-label="Acessibilidade" style={a11yBarStyle}>
            <button
              type="button"
              onClick={() => changeFont(-1)}
              disabled={fontScale <= FONT_MIN}
              aria-label="Diminuir o tamanho da fonte do site"
              style={a11yBtn(false, fontScale <= FONT_MIN)}
            >
              A<span aria-hidden="true" style={{ fontSize: "0.7em" }}>−</span>
            </button>
            <button
              type="button"
              onClick={() => changeFont(0)}
              aria-label="Restaurar o tamanho padrão da fonte"
              style={a11yBtn(false, false)}
            >
              A
            </button>
            <button
              type="button"
              onClick={() => changeFont(1)}
              disabled={fontScale >= FONT_MAX}
              aria-label="Aumentar o tamanho da fonte do site"
              style={a11yBtn(false, fontScale >= FONT_MAX)}
            >
              A<span aria-hidden="true" style={{ fontSize: "1.2em" }}>+</span>
            </button>
            <button
              type="button"
              onClick={toggleContrast}
              aria-pressed={highContrast}
              aria-label="Alternar modo de alto contraste"
              style={{ ...a11yBtn(highContrast, false), minWidth: 0, padding: "0 0.7rem" }}
            >
              <span aria-hidden="true">◐</span> Alto contraste
            </button>
            <span role="status" aria-live="polite" style={srOnly}>
              {`Tamanho da fonte: ${fontScale}%`}
            </span>
          </div>

          {/* Atalhos rápidos para as páginas (o usuário pediu acesso direto) */}
          <div role="group" aria-label="Atalhos" style={quickWrap}>
            {QUICK_ACTIONS.map((a) => (
              <Link key={a.href} href={a.href} onClick={close} style={quickChip}>
                <span aria-hidden="true">{a.icon}</span>
                {a.label}
              </Link>
            ))}
          </div>

          {/* Conversa */}
          <div
            ref={logRef}
            role="log"
            aria-live="polite"
            aria-label="Conversa com o assistente"
            style={logStyle}
          >
            {messages.map((m, i) => {
              const isBot = m.role === "assistant";
              const isStreamingThis = streaming && i === lastIndex && isBot;
              const canSpeak = ttsSupported && isBot && m.content.trim() !== "" && !isStreamingThis;
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: isBot ? "flex-start" : "flex-end" }}>
                  <div style={isBot ? botBubble : userBubble}>
                    {isBot ? (
                      isStreamingThis ? (
                        m.content || (
                          <span style={{ display: "inline-flex", gap: 4, padding: "2px 0" }} aria-hidden="true">
                            <span style={dotStyle("0s")} />
                            <span style={dotStyle(".15s")} />
                            <span style={dotStyle(".3s")} />
                          </span>
                        )
                      ) : (
                        renderRich(m.content)
                      )
                    ) : (
                      m.content
                    )}
                  </div>
                  {canSpeak &&
                    (speakingIdx === i ? (
                      <button type="button" onClick={stopSpeaking} style={ttsBtn} aria-label="Parar leitura em voz alta">
                        <span aria-hidden="true">⏹</span> Parar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => speak(m.content, i)}
                        style={ttsBtn}
                        aria-label="Ouvir esta resposta em voz alta"
                      >
                        <span aria-hidden="true">🔊</span> Ouvir
                      </button>
                    ))}
                </div>
              );
            })}

            {/* Sugestões DEPOIS de cada resposta — a conversa não morre. */}
            {canSuggest && (
              <div style={chipsWrap} role="group" aria-label="Perguntas sugeridas">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={streaming}
                    onClick={() => void send(s)}
                    style={chipStyle}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status "digitando" para leitores de tela */}
          <div role="status" aria-live="polite" style={srOnly}>
            {streaming ? "O assistente está digitando a resposta." : ""}
          </div>

          {/* Campo de envio */}
          <div style={footerStyle}>
            <label htmlFor="ai-input" style={srOnly}>
              Escreva sua pergunta para o assistente
            </label>
            <textarea
              id="ai-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Escreva sua pergunta…"
              rows={1}
              style={textareaStyle}
            />

            {sttSupported && (
              <button
                type="button"
                onClick={listening ? stopListening : startListening}
                aria-label={listening ? "Parar de ouvir sua voz" : "Falar a pergunta por voz"}
                aria-pressed={listening}
                style={iconBtn(listening, false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z"
                    fill="currentColor"
                  />
                  <path
                    d="M6 11a6 6 0 0 0 12 0M12 17v3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}

            <button
              type="button"
              onClick={() => void send(input)}
              disabled={streaming || !input.trim()}
              aria-label="Enviar mensagem"
              style={sendBtnStyle}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3.4 20.4L21 12 3.4 3.6 3.4 10l12 2-12 2z" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
