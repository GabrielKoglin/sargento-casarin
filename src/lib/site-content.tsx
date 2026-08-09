// ============================================================================
// site-content.tsx — conteúdo editável do site (seção "Por que", bio, trajetória,
// comenda e listas de formação/reconhecimentos).
// ============================================================================
// Fonte única: a linha SiteContent(id="main") no banco, editada pela aba
// /admin/conteudo. As páginas (home e /sobre) leem via getSiteContent(), que
// cai em DEFAULT_CONTENT (o texto atual) quando a linha não existe ou está
// incompleta. Negrito nos textos: markdown simples `**assim**` → <strong>.
import { Fragment, type ReactNode } from "react";
import { prisma } from "@/lib/prisma";

export type TrajetoriaStep = { label: string; title: string; text: string };

export type SiteContentData = {
  why: {
    caption: string;
    eyebrow: string;
    paragraphs: string[];
    targets: string[];
  };
  bio: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    quote: string;
    closing: string;
  };
  trajetoria: { steps: TrajetoriaStep[] };
  comenda: { eyebrow: string; title: string; desc: string; meta: string };
  creds: {
    formacao: string[];
    especializacoes: string[];
    honrarias: string[];
  };
};

// Valores padrão = exatamente o que está publicado hoje. Negrito marcado com **.
export const DEFAULT_CONTENT: SiteContentData = {
  why: {
    caption:
      "Casarin não quer ser mais um político — ele representa quem enfrenta a realidade das ruas todos os dias",
    eyebrow: "Por que entrar para a política?",
    paragraphs: [
      "São **15 anos na linha de frente da segurança pública de Mato Grosso**, incluindo a ROTAM, Batalhão Especializado de Patrulhamento Tático da Polícia Militar. Nesse tempo, o Sargento Casarin aprendeu uma lição dura: a coragem prende o criminoso, mas **é a lei que decide se ele fica preso.**",
      "As decisões que definem a segurança das famílias mato-grossenses são tomadas longe das ruas — na Assembleia Legislativa, nas leis e no orçamento. E, na maioria das vezes, por quem nunca vestiu uma farda.",
      "Por isso o sargento decidiu avançar: levar a experiência de quem conhece o problema de perto para onde as decisões são tomadas.",
    ],
    targets: [
      "Quem conhece a rua, não só o gabinete",
      "15 anos de farda na linha de frente",
      "Defesa das famílias mato-grossenses",
      "Respeito a quem veste a farda",
      "Disciplina de tropa especializada na Assembleia",
    ],
  },
  bio: {
    eyebrow: "Sargento Dickson Casarin",
    title: "Uma vida dedicada a proteger Mato Grosso",
    paragraphs: [
      "Dickson Casarin é Sargento da Polícia Militar de Mato Grosso, com 15 anos de serviço dedicados à segurança da população. Da ronda nas ruas às operações da ROTAM, construiu sua trajetória onde o problema acontece: na linha de frente.",
      "Filho de Sinop, fez da rua o seu posto no 26º Batalhão de Polícia Militar, em Nova Mutum: enfrentou o crime de frente, desarticulou quadrilhas, tirou armas de circulação e combateu o tráfico. Convicto de que protege melhor quem mais se prepara, uniu a experiência das ruas ao estudo.",
    ],
    quote:
      "Quem passou a vida enfrentando o crime de perto sabe exatamente o que precisa mudar nas leis e no orçamento para proteger as famílias.",
    closing:
      "Depois de anos vendo boas operações esbarrarem em falta de estrutura, leis frouxas e decisões tomadas longe da realidade, o Sargento Casarin decidiu dar o próximo passo: representar os mato-grossenses na Assembleia Legislativa, com a firmeza de quem conhece o problema e a responsabilidade de quem sempre serviu.",
  },
  trajetoria: {
    steps: [
      {
        label: "01",
        title: "Ingresso na Polícia Militar de Mato Grosso",
        text: "Escolheu servir. Desde o primeiro dia de farda, o compromisso foi com a proteção das famílias mato-grossenses.",
      },
      {
        label: "02",
        title: "Linha de frente",
        text: "Anos de policiamento ostensivo nas ruas, vivendo de perto a realidade da segurança pública — a que não aparece nos gabinetes.",
      },
      {
        label: "03",
        title: "ROTAM — Batalhão Especializado de Patrulhamento Tático",
        text: "Formado em um dos melhores batalhões de Patrulhamento Tático do Brasil, atuando em ocorrências complexas de alto risco.",
      },
      {
        label: "04",
        title: "Candidatura 2026",
        text: "A nova missão: levar a experiência da linha de frente para onde as decisões são tomadas, como Deputado Estadual por Mato Grosso.",
      },
    ],
  },
  comenda: {
    eyebrow: "Honraria · 2026",
    title: "Comenda Marechal Cândido Rondon",
    desc: "A mais alta honraria da Assembleia Legislativa de Mato Grosso a quem presta relevantes serviços ao Estado. Concedida ao Sargento Casarin pela sua trajetória de dedicação à segurança pública mato-grossense.",
    meta: "Assembleia Legislativa de MT · Projeto de Resolução nº 435/2026",
  },
  creds: {
    formacao: [
      "Bacharel em Direito · Faculdade Fasip (2020)",
      "Tecnólogo em Gestão Pública · Anhanguera (2018)",
      "Curso de Formação de Soldados · PMMT (2011)",
    ],
    especializacoes: [
      "Curso de Capacitação da ROTAM (2014)",
      "Inteligência de Segurança Pública (2017)",
      "Atendimento Pré-hospitalar (2015)",
    ],
    honrarias: [
      "Comenda Marechal Cândido Rondon · ALMT (2026)",
      "Moção de Aplausos · Câmara de Lucas do Rio Verde (2013)",
    ],
  },
};

// ------------------------------------------------------------ coerção defensiva
const str = (v: unknown, fb: string): string => (typeof v === "string" ? v : fb);
const strArr = (v: unknown, fb: string[]): string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string") ? (v as string[]) : fb;

function coerce(raw: unknown): SiteContentData {
  const d = DEFAULT_CONTENT;
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const sec = (k: string) =>
    (o[k] && typeof o[k] === "object" ? o[k] : {}) as Record<string, unknown>;
  const why = sec("why");
  const bio = sec("bio");
  const traj = sec("trajetoria");
  const com = sec("comenda");
  const creds = sec("creds");
  const steps = Array.isArray(traj.steps)
    ? (traj.steps as unknown[])
        .map((s) => {
          const st = (s && typeof s === "object" ? s : {}) as Record<string, unknown>;
          return {
            label: str(st.label, ""),
            title: str(st.title, ""),
            text: str(st.text, ""),
          };
        })
        .filter((s) => s.title || s.text)
    : d.trajetoria.steps;
  return {
    why: {
      caption: str(why.caption, d.why.caption),
      eyebrow: str(why.eyebrow, d.why.eyebrow),
      paragraphs: strArr(why.paragraphs, d.why.paragraphs),
      targets: strArr(why.targets, d.why.targets),
    },
    bio: {
      eyebrow: str(bio.eyebrow, d.bio.eyebrow),
      title: str(bio.title, d.bio.title),
      paragraphs: strArr(bio.paragraphs, d.bio.paragraphs),
      quote: str(bio.quote, d.bio.quote),
      closing: str(bio.closing, d.bio.closing),
    },
    trajetoria: { steps: steps.length ? steps : d.trajetoria.steps },
    comenda: {
      eyebrow: str(com.eyebrow, d.comenda.eyebrow),
      title: str(com.title, d.comenda.title),
      desc: str(com.desc, d.comenda.desc),
      meta: str(com.meta, d.comenda.meta),
    },
    creds: {
      formacao: strArr(creds.formacao, d.creds.formacao),
      especializacoes: strArr(creds.especializacoes, d.creds.especializacoes),
      honrarias: strArr(creds.honrarias, d.creds.honrarias),
    },
  };
}

// Lê o conteúdo do banco (registro único). Falha de I/O ou linha inexistente →
// DEFAULT_CONTENT (o site nunca quebra por causa disso).
export async function getSiteContent(): Promise<SiteContentData> {
  try {
    const row = await prisma.siteContent.findUnique({ where: { id: "main" } });
    if (!row) return DEFAULT_CONTENT;
    return coerce(row.data);
  } catch {
    return DEFAULT_CONTENT;
  }
}

// Renderiza um texto com **negrito** em markdown simples como ReactNode.
export function renderRich(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    const m = part.match(/^\*\*([^*]+)\*\*$/);
    return m ? <strong key={i}>{m[1]}</strong> : <Fragment key={i}>{part}</Fragment>;
  });
}
