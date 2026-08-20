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
import { useEffect, useMemo, useRef, useState } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
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

  // Fecha o menu com Esc ou clique fora — listeners ativos só quando aberto.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const onDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [menuOpen]);

  const matches = (p: Proposal) =>
    activeCat === null || (p.category?.trim().toLowerCase() ?? "") === activeCat;

  const choose = (key: string | null) => {
    setActiveCat(key);
    setMenuOpen(false);
  };

  const activeLabel =
    activeCat === null
      ? "Todas as categorias"
      : (categories.find((c) => c.key === activeCat)?.label ?? "Todas as categorias");

  // Marcada como principal = card largo; as demais = temas (cards quadrados).
  const main = proposals.filter((p) => p.featured);
  const temas = proposals.filter((p) => !p.featured);
  const visibleTemas = temas.filter(matches).length;

  return (
    <>
      {categories.length > 1 && (
        <div className={`prop-filter-menu ${menuOpen ? "is-open" : ""}`} ref={menuRef}>
          <span className="prop-filter-menu__label">Filtrar por categoria</span>
          <div className="prop-filter-menu__dd">
            <button
              type="button"
              className="prop-filter-menu__trigger"
              data-filtering={activeCat !== null}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span className="prop-filter-menu__current">{activeLabel}</span>
              <svg
                className="prop-filter-menu__chev"
                viewBox="0 0 16 16"
                aria-hidden="true"
              >
                <path
                  d="M4 6l4 4 4-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {menuOpen && (
              <ul className="prop-filter-menu__panel" role="menu">
                <li role="none">
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={activeCat === null}
                    className={`prop-filter-menu__item ${activeCat === null ? "is-active" : ""}`}
                    onClick={() => choose(null)}
                  >
                    Todas as categorias
                  </button>
                </li>
                {categories.map((c) => (
                  <li role="none" key={c.key}>
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={activeCat === c.key}
                      className={`prop-filter-menu__item ${activeCat === c.key ? "is-active" : ""}`}
                      onClick={() => choose(c.key)}
                    >
                      {c.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
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
