"use client";

// ============================================================================
// home-proposals.tsx — grade de propostas da HOME (teaser) + modal completo
// ============================================================================
// Espelha o comportamento da /propostas: clicar "Ver proposta" abre a proposta
// inteira no ProposalModal (em vez de navegar para uma página de detalhe).
import { useState } from "react";
import type { Proposal } from "@/generated/prisma/client";
import { ProposalIcon } from "@/components/proposal-icon";
import { ProposalModal } from "@/components/proposal-modal";

export function HomeProposals({ proposals }: { proposals: Proposal[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = proposals.find((p) => p.id === openId) ?? null;

  return (
    <>
      <div className="propostas-grid">
        {proposals.map((p, i) => (
          <div className={`prop-card fi ${i > 0 ? `d${i}` : ""}`} key={p.id}>
            <div className="prop-icon" aria-hidden="true">
              <ProposalIcon slug={p.slug} category={p.category} />
            </div>
            <h3>{p.title}</h3>
            <button
              type="button"
              className="prop-link"
              onClick={() => setOpenId(p.id)}
            >
              Ver proposta <span aria-hidden="true">➔</span>
            </button>
          </div>
        ))}
      </div>
      {open && <ProposalModal proposal={open} onClose={() => setOpenId(null)} />}
    </>
  );
}
