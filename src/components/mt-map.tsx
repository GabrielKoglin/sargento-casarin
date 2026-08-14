"use client";

// ============================================================================
// mt-map.tsx — mapa 3D interativo de Mato Grosso (142 municípios) + busca
// ============================================================================
// Fluxo (página /adesivos): o usuário navega/gira o mapa, busca a própria
// cidade e clica. Se houver LÍDER APOIADOR ali, abre o WhatsApp dele para
// combinar a retirada do adesivo. Se não houver, aparece o convite "Quero ser
// líder apoiador" (cadastro que nasce pendente, aprovado no painel).
//
// Geometria: /data/mt-municipios.json (malha do IBGE já projetada em SVG).
// Efeito 3D: perspective + rotateX no palco + extrusão por drop-shadow empilhado
// (leve, sem WebGL). Acessibilidade: a BUSCA é o caminho principal (combobox);
// o mapa é um reforço visual. Respeita prefers-reduced-motion (sem flutuação).
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { waLink } from "@/lib/whatsapp";
import { LeaderSignup } from "@/components/leader-signup";

export type LeaderPin = {
  id: string;
  name: string;
  whatsapp: string;
  city: string;
  cityCode: string | null;
};

type Muni = {
  code: string;
  name: string;
  slug: string;
  d: string;
  cx: number | null;
  cy: number | null;
};
type Geo = { viewBox: string; width: number; height: number; municipios: Muni[] };

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const MIN_SCALE = 1;
const MAX_SCALE = 6;
const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

export function MtMap({ leaders }: { leaders: LeaderPin[] }) {
  const [geo, setGeo] = useState<Geo | null>(null);
  const [query, setQuery] = useState("");
  const [openList, setOpenList] = useState(false);
  const [selected, setSelected] = useState<Muni | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [signupCity, setSignupCity] = useState<Muni | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ x: 0, y: 0, s: 1 });
  const [flying, setFlying] = useState(false);

  // Carrega a geometria uma vez.
  useEffect(() => {
    let alive = true;
    fetch("/data/mt-municipios.json")
      .then((r) => r.json())
      .then((g: Geo) => {
        if (alive) setGeo(g);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Índice de líderes por código IBGE e por nome (fallback sem código).
  const { byCode, bySlug } = useMemo(() => {
    const byCode = new Map<string, LeaderPin[]>();
    const bySlug = new Map<string, LeaderPin[]>();
    for (const l of leaders) {
      if (l.cityCode) {
        const a = byCode.get(l.cityCode) ?? [];
        a.push(l);
        byCode.set(l.cityCode, a);
      }
      const s = norm(l.city).replace(/[^a-z0-9]+/g, "-");
      const a = bySlug.get(s) ?? [];
      a.push(l);
      bySlug.set(s, a);
    }
    return { byCode, bySlug };
  }, [leaders]);

  const leadersFor = useCallback(
    (m: Muni | null): LeaderPin[] => {
      if (!m) return [];
      return byCode.get(m.code) ?? bySlug.get(m.slug) ?? [];
    },
    [byCode, bySlug],
  );
  const isCovered = useCallback(
    (m: Muni) => byCode.has(m.code) || bySlug.has(m.slug),
    [byCode, bySlug],
  );

  const coveredCount = useMemo(
    () => (geo ? geo.municipios.filter(isCovered).length : 0),
    [geo, isCovered],
  );

  const [vbW, vbH] = useMemo(() => {
    if (!geo) return [1000, 962];
    const p = geo.viewBox.split(" ").map(Number);
    return [p[2], p[3]];
  }, [geo]);

  // União de todos os municípios (um path só) para recortar a imagem de satélite.
  const clipD = useMemo(
    () => (geo ? geo.municipios.map((m) => m.d).join("") : ""),
    [geo],
  );

  // Busca (accent-insensitive), no máx. 8 resultados.
  const matches = useMemo(() => {
    if (!geo || query.trim().length < 1) return [];
    const q = norm(query);
    return geo.municipios
      .filter((m) => norm(m.name).includes(q))
      .slice(0, 8);
  }, [geo, query]);

  // Centraliza um município (fly-to) com transição suave.
  const focusMuni = useCallback(
    (m: Muni) => {
      setSelected(m);
      const stage = stageRef.current;
      if (!stage || m.cx == null || m.cy == null) return;
      const rect = stage.getBoundingClientRect();
      const k = Math.min(rect.width / vbW, rect.height / vbH);
      // Posição de tela do centroide na escala base (preserveAspectRatio meet).
      const sx = (rect.width - vbW * k) / 2 + m.cx * k;
      const sy = (rect.height - vbH * k) / 2 + m.cy * k;
      const s = 2.6;
      // Compensa parcialmente a inclinação (o topo "afunda" na perspectiva).
      const tx = s * (rect.width / 2 - sx);
      const ty = s * (rect.height / 2 - sy) - rect.height * 0.06;
      setFlying(true);
      setView({ x: tx, y: ty, s });
      window.setTimeout(() => setFlying(false), 650);
    },
    [vbW, vbH],
  );

  const selectByMuni = useCallback(
    (m: Muni) => {
      setQuery(m.name);
      setOpenList(false);
      setSignupCity(null);
      focusMuni(m);
    },
    [focusMuni],
  );

  const resetView = useCallback(() => {
    setFlying(true);
    setView({ x: 0, y: 0, s: 1 });
    window.setTimeout(() => setFlying(false), 650);
  }, []);

  const zoomBy = useCallback((factor: number) => {
    setFlying(true);
    setView((v) => ({ ...v, s: clamp(v.s * factor, MIN_SCALE, MAX_SCALE) }));
    window.setTimeout(() => setFlying(false), 300);
  }, []);

  // ---- arrastar (pan) ----
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const onPointerDown = (e: ReactPointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.current.moved = true;
    drag.current.x = e.clientX;
    drag.current.y = e.clientY;
    setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
  };
  const onPointerUp = (e: ReactPointerEvent) => {
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    drag.current = null;
  };
  const onWheel = (e: React.WheelEvent) => {
    if (!stageRef.current) return;
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    setView((v) => ({ ...v, s: clamp(v.s * factor, MIN_SCALE, MAX_SCALE) }));
  };

  // Clique num município (só conta se não foi arrasto).
  const onMuniClick = (m: Muni) => {
    if (drag.current?.moved) return;
    selectByMuni(m);
  };

  const selectedLeaders = leadersFor(selected);

  return (
    <div className="mtmap">
      {/* ---------------- busca ---------------- */}
      <div className="mtmap__search">
        <label htmlFor="mtmap-q" className="mtmap__search-label">
          Busque sua cidade
        </label>
        <div className="mtmap__combo">
          <span className="mtmap__search-ico" aria-hidden="true">🔍</span>
          <input
            id="mtmap-q"
            type="text"
            className="mtmap__input"
            placeholder="Ex.: Cuiabá, Sinop, Rondonópolis…"
            autoComplete="off"
            role="combobox"
            aria-expanded={openList && matches.length > 0}
            aria-controls="mtmap-list"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpenList(true);
            }}
            onFocus={() => setOpenList(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && matches[0]) {
                e.preventDefault();
                selectByMuni(matches[0]);
              } else if (e.key === "Escape") {
                setOpenList(false);
              }
            }}
          />
          {query && (
            <button
              type="button"
              className="mtmap__clear"
              aria-label="Limpar busca"
              onClick={() => {
                setQuery("");
                setOpenList(false);
              }}
            >
              ×
            </button>
          )}
          {openList && matches.length > 0 && (
            <ul id="mtmap-list" className="mtmap__results" role="listbox">
              {matches.map((m) => (
                <li key={m.code} role="option" aria-selected={selected?.code === m.code}>
                  <button type="button" onClick={() => selectByMuni(m)}>
                    <span>{m.name}</span>
                    {isCovered(m) ? (
                      <span className="mtmap__chip mtmap__chip--yes">tem líder</span>
                    ) : (
                      <span className="mtmap__chip">sem líder</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="mtmap__legend" aria-hidden="true">
          <span className="mtmap__dot mtmap__dot--yes"></span> cidade com líder
          <span className="mtmap__dot"></span> ainda sem líder
          <span className="mtmap__legend-count">{coveredCount} cidades com líder</span>
        </p>
      </div>

      {/* ---------------- palco 3D ---------------- */}
      <div className="mtmap__stage" ref={stageRef}>
        {!geo ? (
          <div className="mtmap__loading">Carregando o mapa de Mato Grosso…</div>
        ) : (
          <>
            <div className="mtmap__float">
              <div className="mtmap__tilt">
                <div
                  className={`mtmap__pan${flying ? " is-flying" : ""}`}
                  style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})` }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                >
                  <svg
                    viewBox={geo.viewBox}
                    className="mtmap__svg"
                    preserveAspectRatio="xMidYMid meet"
                    onWheel={onWheel}
                  >
                    <defs>
                      {/* recorte: imagem de satélite só dentro do estado (união dos municípios) */}
                      <clipPath id="mtClip">
                        <path d={clipD} />
                      </clipPath>
                      {/* brilho suave dos pinos de cidade com líder */}
                      <filter id="mtPin" x="-120%" y="-120%" width="340%" height="340%">
                        <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#12b84b" floodOpacity="0.9" />
                      </filter>
                    </defs>

                    {/* terra: imagem de satélite recortada + extrusão (espessura) */}
                    <g className="mtmap__land">
                      <image
                        className="mtmap__sat"
                        href="/data/mt-satellite.webp"
                        x="0"
                        y="0"
                        width={vbW}
                        height={vbH}
                        preserveAspectRatio="none"
                        clipPath="url(#mtClip)"
                      />
                      <g className="mtmap__faces">
                        {geo.municipios.map((m) =>
                          m.d ? (
                            <path
                              key={m.code}
                              d={m.d}
                              data-code={m.code}
                              data-slug={m.slug}
                              className={[
                                "mtmap__muni",
                                isCovered(m) ? "is-covered" : "",
                                selected?.code === m.code ? "is-selected" : "",
                                hover === m.code ? "is-hover" : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                              onMouseEnter={() => setHover(m.code)}
                              onMouseLeave={() => setHover((h) => (h === m.code ? null : h))}
                              onClick={() => onMuniClick(m)}
                            >
                              <title>{m.name}</title>
                            </path>
                          ) : null,
                        )}
                      </g>
                    </g>

                    {/* pinos das cidades com líder (e da selecionada) */}
                    <g className="mtmap__markers">
                      {geo.municipios.map((m) => {
                        const sel = selected?.code === m.code;
                        if (m.cx == null || m.cy == null || (!isCovered(m) && !sel)) return null;
                        return (
                          <circle
                            key={m.code}
                            cx={m.cx}
                            cy={m.cy}
                            r={sel ? 9 : 6.5}
                            filter="url(#mtPin)"
                            className={[
                              "mtmap__pin",
                              isCovered(m) ? "is-covered" : "",
                              sel ? "is-selected" : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          />
                        );
                      })}
                    </g>
                  </svg>
                </div>
              </div>
            </div>

            {/* leitura do hover */}
            <div className="mtmap__readout" aria-hidden="true">
              {hover
                ? geo.municipios.find((m) => m.code === hover)?.name
                : "Arraste para girar · role para dar zoom"}
            </div>

            {/* controles */}
            <div className="mtmap__controls">
              <button type="button" onClick={() => zoomBy(1.3)} aria-label="Aproximar">+</button>
              <button type="button" onClick={() => zoomBy(1 / 1.3)} aria-label="Afastar">−</button>
              <button type="button" onClick={resetView} aria-label="Ver Mato Grosso inteiro">⟲</button>
            </div>
          </>
        )}
      </div>

      <p className="mtmap__credit">
        Imagem de satélite: <a href="https://s2maps.eu" target="_blank" rel="noopener noreferrer">Sentinel-2 cloudless</a> (EOX) · ESA
      </p>

      {/* ---------------- painel da cidade ---------------- */}
      {selected && (
        <div className="mtmap__panel" role="region" aria-label={`Cidade: ${selected.name}`}>
          <div className="mtmap__panel-head">
            <span className="mtmap__panel-eyebrow">Sua cidade</span>
            <h3 className="mtmap__panel-city">{selected.name}</h3>
          </div>

          {selectedLeaders.length > 0 ? (
            <>
              <p className="mtmap__panel-lead">
                {selectedLeaders.length === 1
                  ? "Temos um líder apoiador aqui! Fale no WhatsApp para combinar a retirada do seu adesivo:"
                  : "Temos líderes apoiadores aqui! Escolha um e fale no WhatsApp para retirar seu adesivo:"}
              </p>
              <ul className="mtmap__leaders">
                {selectedLeaders.map((l) => (
                  <li key={l.id}>
                    <div className="mtmap__leader-info">
                      <strong>{l.name}</strong>
                      <span>Líder apoiador · {selected.name}</span>
                    </div>
                    <a
                      className="mtmap__wa"
                      href={waLink(
                        l.whatsapp,
                        `Olá, ${l.name}! Vi no site do Sargento Casarin que você é líder apoiador em ${selected.name}. Gostaria de pegar meu adesivo. Pode me ajudar?`,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span aria-hidden="true">💬</span> Falar no WhatsApp
                    </a>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="mtmap__empty">
              <p className="mtmap__panel-lead">
                Ainda <strong>não temos um líder apoiador</strong> em {selected.name}.
                Que tal ser você a levar os adesivos do Casarin para a sua cidade?
              </p>
              <button
                type="button"
                className="mtmap__cta"
                onClick={() => setSignupCity(selected)}
              >
                Quero ser líder apoiador <span aria-hidden="true">➔</span>
              </button>
            </div>
          )}
        </div>
      )}

      {signupCity && (
        <LeaderSignup
          city={signupCity.name}
          cityCode={signupCity.code}
          onClose={() => setSignupCity(null)}
        />
      )}
    </div>
  );
}
