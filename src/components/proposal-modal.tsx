"use client";

// ============================================================================
// proposal-modal.tsx — modal "proposta completa" (reutilizável: /propostas + home)
// ============================================================================
// Mostra a proposta (imagem + resumo + texto completo em markdown). Acessível:
// role=dialog, foco no botão de fechar, Esc e clique no fundo fecham, trava o
// scroll do body e devolve o foco ao fechar. Propostas PRINCIPAIS (`featured`)
// ganham uma entrada animada mais destacada.
import { useEffect, useRef } from "react";
import type { Proposal } from "@/generated/prisma/client";
import { RichText } from "@/components/rich-text";

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

  // "Vazio" = nada a mostrar DENTRO do popup (imagem externa não conta aqui).
  const showsImage = Boolean(proposal.image) && proposal.imagePlacement !== "external";
  const empty = !proposal.content && !showsImage && !proposal.description;

  return (
    <div className="prop-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className={`prop-modal ${proposal.featured ? "prop-modal--featured" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={proposal.title}
        onClick={(e) => e.stopPropagation()}
      >
        {proposal.featured && (
          <span className="prop-modal__sheen" aria-hidden="true" />
        )}
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

          {proposal.image && proposal.imagePlacement !== "external" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="prop-modal__img" src={proposal.image} alt={proposal.title} />
          )}

          <div className="prop-modal__body">
            {proposal.description && (
              <p className="prop-modal__lead">{proposal.description}</p>
            )}
            {proposal.content && <RichText md={proposal.content} />}
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
