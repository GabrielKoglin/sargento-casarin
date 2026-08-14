"use client";

// ============================================================================
// home-proposals.tsx — grade de TEMAS da HOME (teaser) + modal + CTA
// ============================================================================
// A home mostra os TEMAS (as propostas principais têm o palco na /propostas).
// Clicar num card abre o tema no ProposalModal; o botão animado abaixo leva
// para a página completa de propostas.
import { useState } from "react";
import Link from "next/link";
import type { Proposal } from "@/generated/prisma/client";
import { ProposalIcon } from "@/components/proposal-icon";
import { ProposalModal } from "@/components/proposal-modal";

export function HomeProposals({ proposals }: { proposals: Proposal[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = proposals.find((p) => p.id === openId) ?? null;

  return (
    <>
      <p className="propostas-temas-cap fi">Alguns dos temas que vamos abordar</p>

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
              Ver tema <span aria-hidden="true">➔</span>
            </button>
          </div>
        ))}
      </div>

      <div className="propostas-more fi">
        <Link href="/propostas" className="btn btn-gold propostas-cta">
          Ver as propostas <span aria-hidden="true">➔</span>
        </Link>
      </div>

      {open && <ProposalModal proposal={open} onClose={() => setOpenId(null)} />}
    </>
  );
}
