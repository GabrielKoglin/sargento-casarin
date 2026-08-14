"use client";

// ============================================================================
// mt-map.tsx — mapa REAL de Mato Grosso (Leaflet + tiles CARTO) + líderes
// ============================================================================
// Página /adesivos: mapa navegável de verdade (ruas, cidades, zoom real). As
// cidades COM líder ganham um pino verde; clicar (ou buscar) abre o painel com
// o WhatsApp do líder — ou o convite "Quero ser líder apoiador" se não houver.
// Leaflet é carregado dinamicamente (só no cliente). Tiles: CARTO Voyager
// (visual claro estilo Google), OpenStreetMap + CARTO com atribuição.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, Marker } from "leaflet";
import { MT_CITIES, type MtCity } from "@/data/mt-cities";
import { waLink } from "@/lib/whatsapp";
import { LeaderSignup } from "@/components/leader-signup";

export type LeaderPin = {
  id: string;
  name: string;
  whatsapp: string;
  city: string;
  cityCode: string | null;
};

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// Enquadramento de Mato Grosso (bbox aproximado da malha do IBGE).
const MT_BOUNDS: [[number, number], [number, number]] = [
  [-18.1, -61.7],
  [-7.3, -50.2],
];

export function MtMap({ leaders }: { leaders: LeaderPin[] }) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [ready, setReady] = useState(false);

  const [query, setQuery] = useState("");
  const [openList, setOpenList] = useState(false);
  const [selected, setSelected] = useState<MtCity | null>(null);
  const [signupCity, setSignupCity] = useState<MtCity | null>(null);

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
    (c: MtCity | null): LeaderPin[] =>
      c ? byCode.get(c.code) ?? bySlug.get(c.slug) ?? [] : [],
    [byCode, bySlug],
  );
  const isCovered = useCallback(
    (c: MtCity) => byCode.has(c.code) || bySlug.has(c.slug),
    [byCode, bySlug],
  );
  const coveredCities = useMemo(
    () => MT_CITIES.filter(isCovered),
    [isCovered],
  );

  const selectCity = useCallback((c: MtCity) => {
    setSelected(c);
    setSignupCity(null);
    setQuery(c.name);
    setOpenList(false);
    mapRef.current?.flyTo([c.lat, c.lng], 9, { duration: 0.9 });
  }, []);

  // Inicializa o mapa Leaflet uma vez (client-only).
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    let cancelled = false;
    let created: LeafletMap | null = null;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapEl.current) return;
      const map = L.map(mapEl.current, {
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: true,
        minZoom: 5,
        maxZoom: 16,
      });
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 20,
        },
      ).addTo(map);
      map.fitBounds(MT_BOUNDS);
      created = map;
      mapRef.current = map;
      setReady(true);
    })();
    return () => {
      cancelled = true;
      created?.remove();
      mapRef.current = null;
      markersRef.current = [];
      setReady(false);
    };
  }, []);

  // (Re)desenha os pinos dos líderes quando o mapa está pronto / a lista muda.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled) return;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      for (const c of coveredCities) {
        const icon = L.divIcon({
          className: "mtmk",
          html: '<span class="mtmk__pin" aria-hidden="true"></span>',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
        const mk = L.marker([c.lat, c.lng], { icon, title: c.name }).addTo(map);
        mk.bindTooltip(c.name, { direction: "top", offset: [0, -10] });
        mk.on("click", () => selectCity(c));
        markersRef.current.push(mk);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, coveredCities, selectCity]);

  // Busca (accent-insensitive), no máx. 8 resultados.
  const matches = useMemo(() => {
    if (query.trim().length < 1) return [];
    const q = norm(query);
    return MT_CITIES.filter((c) => norm(c.name).includes(q)).slice(0, 8);
  }, [query]);

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
                selectCity(matches[0]);
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
              {matches.map((c) => (
                <li key={c.code} role="option" aria-selected={selected?.code === c.code}>
                  <button type="button" onClick={() => selectCity(c)}>
                    <span>{c.name}</span>
                    {isCovered(c) ? (
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
          <span className="mtmap__legend-count">
            {coveredCities.length} cidades com líder
          </span>
        </p>
      </div>

      {/* ---------------- mapa real ---------------- */}
      <div className="mtmap__stage">
        <div ref={mapEl} className="mtmap__leaflet" />
        {!ready && (
          <div className="mtmap__loading">Carregando o mapa de Mato Grosso…</div>
        )}
      </div>

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
