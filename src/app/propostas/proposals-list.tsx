"use client";

// ============================================================================
// proposals-list.tsx — propostas principais (cards largos) + temas (grade
// quadrada) + modal "proposta completa"
// ============================================================================
// Propostas COM texto completo (`content`) são as PRINCIPAIS: card largo com
// resumo. As demais são TEMAS: cards quadrados, lado a lado, só com o título.
// Ambos abrem a proposta INTEIRA num modal (sem navegar). Acessível: role=
// dialog, foco no botão de fechar, Esc e clique no fundo fecham, trava o scroll
// do body e devolve o foco ao fechar.
import { useCallback, useEffect, useRef, useState } from "react";
import type { Proposal } from "@/generated/prisma/client";
import { ProposalIcon } from "@/components/proposal-icon";
import { RichText } from "@/components/rich-text";

const lines = (s: string) => s.split("\n").filter(Boolean);

export function ProposalsList({
  proposals,
  listTitle,
}: {
  proposals: Proposal[];
  listTitle: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = proposals.find((p) => p.id === openId) ?? null;
  const close = useCallback(() => setOpenId(null), []);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [open, close]);

  const goals = open ? lines(open.goals) : [];
  const benefits = open ? lines(open.benefits) : [];

  // COM texto completo = proposta principal; SEM = tema.
  const main = proposals.filter((p) => p.content);
  const temas = proposals.filter((p) => !p.content);

  return (
    <>
      {main.map((p) => (
        <div className="eixo-card fi" key={p.id}>
          <div className="eixo-icon" aria-hidden="true">
            <ProposalIcon slug={p.slug} category={p.category} />
          </div>
          <div className="eixo-body">
            <h2>{p.title}</h2>
            {p.description && <p>{p.description}</p>}
            <button
              type="button"
              className="btn btn-outline eixo-btn"
              onClick={() => setOpenId(p.id)}
            >
              Ver proposta completa <span aria-hidden="true">➔</span>
            </button>
          </div>
        </div>
      ))}

      {temas.length > 0 && (
        <>
          {listTitle && <h2 className="propostas-list-title fi">{listTitle}</h2>}
          <div className="temas-grid">
            {temas.map((t) => (
              <button
                type="button"
                className="tema-card fi"
                key={t.id}
                onClick={() => setOpenId(t.id)}
              >
                <span className="tema-card__icon" aria-hidden="true">
                  <ProposalIcon slug={t.slug} category={t.category} />
                </span>
                <span className="tema-card__title">{t.title}</span>
                <span className="tema-card__link">
                  Ver proposta completa <span aria-hidden="true">➔</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {open && (
        <div className="prop-modal-backdrop" role="presentation" onClick={close}>
          <div
            className="prop-modal"
            role="dialog"
            aria-modal="true"
            aria-label={open.title}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              ref={closeBtnRef}
              type="button"
              className="prop-modal__close"
              onClick={close}
              aria-label="Fechar"
            >
              ×
            </button>
            <div className="prop-modal__scroll">
              {open.category && (
                <span className="prop-modal__eyebrow">{open.category}</span>
              )}
              <h2 className="prop-modal__title">{open.title}</h2>

              {open.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="prop-modal__img" src={open.image} alt={open.title} />
              )}

              <div className="prop-modal__body">
                {open.description && (
                  <p className="prop-modal__lead">{open.description}</p>
                )}
                {open.content && <RichText md={open.content} />}
                {open.problem && (
                  <>
                    <h3>O problema</h3>
                    <p>{open.problem}</p>
                  </>
                )}
                {open.objective && (
                  <>
                    <h3>Objetivo</h3>
                    <p>{open.objective}</p>
                  </>
                )}
                {open.solution && (
                  <>
                    <h3>Como vamos fazer</h3>
                    <p>{open.solution}</p>
                  </>
                )}
                {goals.length > 0 && (
                  <>
                    <h3>Metas</h3>
                    <ul>
                      {goals.map((g, i) => (
                        <li key={i}>{g}</li>
                      ))}
                    </ul>
                  </>
                )}
                {benefits.length > 0 && (
                  <>
                    <h3>Benefícios para você</h3>
                    <ul>
                      {benefits.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </>
                )}
                {open.faq && (
                  <>
                    <h3>Perguntas frequentes</h3>
                    <p>{open.faq}</p>
                  </>
                )}
                {/* Tema ainda sem conteúdo detalhado */}
                {!open.content &&
                  !open.description &&
                  !open.problem &&
                  !open.objective &&
                  !open.solution &&
                  goals.length === 0 &&
                  benefits.length === 0 &&
                  !open.faq && (
                    <p className="prop-modal__lead">
                      Proposta em elaboração. Em breve o conteúdo completo estará
                      disponível aqui.
                    </p>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
