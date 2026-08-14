"use client";

// ============================================================================
// proposals-list.tsx — propostas principais (cards largos) + temas (grade
// quadrada). Ambos abrem a proposta completa no ProposalModal reutilizável.
// ============================================================================
// Propostas marcadas como PRINCIPAIS (`featured`) viram cards largos com resumo.
// As demais são TEMAS: cards quadrados, lado a lado, só com o título.
import { useState } from "react";
import type { Proposal } from "@/generated/prisma/client";
import { ProposalIcon } from "@/components/proposal-icon";
import { ProposalModal } from "@/components/proposal-modal";

export function ProposalsList({
  proposals,
  listTitle,
}: {
  proposals: Proposal[];
  listTitle: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = proposals.find((p) => p.id === openId) ?? null;

  // Marcada como principal = card largo; as demais = temas (cards quadrados).
  const main = proposals.filter((p) => p.featured);
  const temas = proposals.filter((p) => !p.featured);

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

      {open && <ProposalModal proposal={open} onClose={() => setOpenId(null)} />}
    </>
  );
}
