"use client";

// ============================================================================
// proposals-list.tsx — propostas principais (cards largos) + temas (grade
// quadrada). Ambos abrem a proposta completa no ProposalModal reutilizável.
// ============================================================================
// Propostas marcadas como PRINCIPAIS (`featured`) viram cards largos com resumo.
// As demais são TEMAS: cards quadrados, lado a lado, só com o título.
//
// FILTROS por categoria (Segurança, Educação, Saúde…): derivados das categorias
// que EXISTEM de fato nas propostas. Em vez de recriar os cards ao filtrar (o
// que os traria de volta como `.fi` invisível, pois o TacticalFx só revela na
// montagem), mantemos TODOS montados com key estável e apenas escondemos
// (`display:none`) os que não batem com o filtro — o card já revelado continua
// revelado e o filtro fica instantâneo.
import { useMemo, useState } from "react";
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
  // null = "Todas"; caso contrário guarda a categoria normalizada (minúscula).
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const open = proposals.find((p) => p.id === openId) ?? null;

  // Categorias presentes, na ordem em que aparecem. Chave normalizada
  // (minúscula, sem espaços nas pontas) para casar; rótulo = 1ª grafia vista.
  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of proposals) {
      const label = p.category?.trim();
      if (!label) continue;
      const key = label.toLowerCase();
      if (!seen.has(key)) seen.set(key, label);
    }
    return Array.from(seen, ([key, label]) => ({ key, label }));
  }, [proposals]);

  const matches = (p: Proposal) =>
    activeCat === null || (p.category?.trim().toLowerCase() ?? "") === activeCat;

  // Marcada como principal = card largo; as demais = temas (cards quadrados).
  const main = proposals.filter((p) => p.featured);
  const temas = proposals.filter((p) => !p.featured);
  const visibleTemas = temas.filter(matches).length;

  return (
    <>
      {categories.length > 1 && (
        <div
          className="prop-filters"
          role="group"
          aria-label="Filtrar propostas por categoria"
        >
          <button
            type="button"
            className={`prop-filter ${activeCat === null ? "is-active" : ""}`}
            aria-pressed={activeCat === null}
            onClick={() => setActiveCat(null)}
          >
            Todas
          </button>
          {categories.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`prop-filter ${activeCat === c.key ? "is-active" : ""}`}
              aria-pressed={activeCat === c.key}
              onClick={() => setActiveCat(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {main.map((p) => {
        const externalImg = Boolean(p.image) && p.imagePlacement === "external";
        return (
          <div
            className={`eixo-card fi${externalImg ? " eixo-card--with-img" : ""}${
              matches(p) ? "" : " is-filtered-out"
            }`}
            key={p.id}
          >
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
            {externalImg && p.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="eixo-img" src={p.image} alt={p.title} />
            )}
          </div>
        );
      })}

      {temas.length > 0 && (
        <>
          {listTitle && visibleTemas > 0 && (
            <h2 className="propostas-list-title fi">{listTitle}</h2>
          )}
          <div className="temas-grid">
            {temas.map((t) => (
              <button
                type="button"
                className={`tema-card fi${matches(t) ? "" : " is-filtered-out"}`}
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
