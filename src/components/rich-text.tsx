// ============================================================================
// rich-text.tsx — renderizador de mini-markdown (client-safe, sem deps de server)
// ============================================================================
// Usado no texto completo da proposta (modal + página). Suporta:
//   ## Título        → <h3>
//   ### Subtítulo     → <h4>
//   - item  /  * item → lista <ul><li>
//   **negrito**       → <strong>
//   linhas em branco separam parágrafos.
import { Fragment, type ReactNode } from "react";

function inline(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    const m = part.match(/^\*\*([^*]+)\*\*$/);
    return m ? (
      <strong key={i}>{m[1]}</strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    );
  });
}

export function RichText({ md }: { md: string }) {
  const blocks: ReactNode[] = [];
  let para: string[] = [];
  let list: string[] = [];

  const flushPara = () => {
    if (para.length) {
      blocks.push(<p key={blocks.length}>{inline(para.join(" "))}</p>);
      para = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      const items = list;
      blocks.push(
        <ul key={blocks.length}>
          {items.map((it, k) => (
            <li key={k}>{inline(it)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };

  for (const raw of md.split("\n")) {
    const line = raw.trim();
    if (line === "") {
      flushPara();
      flushList();
    } else if (line.startsWith("### ")) {
      flushPara();
      flushList();
      blocks.push(<h4 key={blocks.length}>{inline(line.slice(4))}</h4>);
    } else if (line.startsWith("## ")) {
      flushPara();
      flushList();
      blocks.push(<h3 key={blocks.length}>{inline(line.slice(3))}</h3>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      flushPara();
      list.push(line.slice(2));
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();

  return <>{blocks}</>;
}
