"use client";

// ============================================================================
// proposal-modal.tsx — modal "proposta completa" (reutilizável: /propostas + home)
// ============================================================================
// Mostra a proposta INTEIRA (imagem + texto completo em markdown + campos).
// Acessível: role=dialog, foco no botão de fechar, Esc e clique no fundo fecham,
// trava o scroll do body e devolve o foco ao fechar.
import { useEffect, useRef } from "react";
import type { Proposal } from "@/generated/prisma/client";
import { RichText } from "@/components/rich-text";

const lines = (s: string) => s.split("\n").filter(Boolean);

export function ProposalModal({
  proposal,
  onClose,
}: {
  proposal: Proposal;
  onClose: () => void;
}) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [onClose]);

  const goals = lines(proposal.goals);
  const benefits = lines(proposal.benefits);
  const empty =
    !proposal.content &&
    !proposal.image &&
    !proposal.description &&
    !proposal.problem &&
    !proposal.objective &&
    !proposal.solution &&
    goals.length === 0 &&
    benefits.length === 0 &&
    !proposal.faq;

  return (
    <div className="prop-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="prop-modal"
        role="dialog"
        aria-modal="true"
        aria-label={proposal.title}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeBtnRef}
          type="button"
          className="prop-modal__close"
          onClick={onClose}
          aria-label="Fechar"
        >
          ×
        </button>
        <div className="prop-modal__scroll">
          {proposal.category && (
            <span className="prop-modal__eyebrow">{proposal.category}</span>
          )}
          <h2 className="prop-modal__title">{proposal.title}</h2>

          {proposal.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="prop-modal__img" src={proposal.image} alt={proposal.title} />
          )}

          <div className="prop-modal__body">
            {proposal.description && (
              <p className="prop-modal__lead">{proposal.description}</p>
            )}
            {proposal.content && <RichText md={proposal.content} />}
            {proposal.problem && (
              <>
                <h3>O problema</h3>
                <p>{proposal.problem}</p>
              </>
            )}
            {proposal.objective && (
              <>
                <h3>Objetivo</h3>
                <p>{proposal.objective}</p>
              </>
            )}
            {proposal.solution && (
              <>
                <h3>Como vamos fazer</h3>
                <p>{proposal.solution}</p>
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
            {proposal.faq && (
              <>
                <h3>Perguntas frequentes</h3>
                <p>{proposal.faq}</p>
              </>
            )}
            {empty && (
              <p className="prop-modal__lead">
                Proposta em elaboração. Em breve o conteúdo completo estará
                disponível aqui.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
