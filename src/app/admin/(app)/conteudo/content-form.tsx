"use client";

// ============================================================================
// content-form.tsx — formulário do editor de conteúdo do site
// ============================================================================
// Client component. Mantém TODO o documento em estado e o serializa num campo
// oculto "payload" (JSON) que a saveSiteContent grava. Listas (parágrafos,
// selos, passos da trajetória, formação…) têm adicionar/remover. Negrito nos
// textos: markdown simples `**assim**`.
import { useActionState, useState } from "react";
import { saveSiteContent, type ContentFormState } from "./actions";
import type { SiteContentData, TrajetoriaStep, ManifestoStat, CredItem, IconCard, SocialChannel, LegalPage } from "@/lib/site-content";

const INITIAL: ContentFormState = { ok: false, error: null };

export function ContentForm({ initial }: { initial: SiteContentData }) {
  const [data, setData] = useState<SiteContentData>(initial);
  const [state, formAction, pending] = useActionState(saveSiteContent, INITIAL);

  const setWhy = (patch: Partial<SiteContentData["why"]>) =>
    setData((d) => ({ ...d, why: { ...d.why, ...patch } }));
  const setBio = (patch: Partial<SiteContentData["bio"]>) =>
    setData((d) => ({ ...d, bio: { ...d.bio, ...patch } }));
  const setComenda = (patch: Partial<SiteContentData["comenda"]>) =>
    setData((d) => ({ ...d, comenda: { ...d.comenda, ...patch } }));
  const setCreds = (patch: Partial<SiteContentData["creds"]>) =>
    setData((d) => ({ ...d, creds: { ...d.creds, ...patch } }));
  const setSteps = (steps: TrajetoriaStep[]) =>
    setData((d) => ({ ...d, trajetoria: { steps } }));
  const setManifesto = (patch: Partial<SiteContentData["manifesto"]>) =>
    setData((d) => ({ ...d, manifesto: { ...d.manifesto, ...patch } }));
  const setHome = (patch: Partial<SiteContentData["home"]>) =>
    setData((d) => ({ ...d, home: { ...d.home, ...patch } }));
  const setTropa = (patch: Partial<SiteContentData["tropa"]>) =>
    setData((d) => ({ ...d, tropa: { ...d.tropa, ...patch } }));
  const setAjudar = (patch: Partial<SiteContentData["ajudar"]>) =>
    setData((d) => ({ ...d, ajudar: { ...d.ajudar, ...patch } }));
  const setMidias = (patch: Partial<SiteContentData["midias"]>) =>
    setData((d) => ({ ...d, midias: { ...d.midias, ...patch } }));
  const setContato = (patch: Partial<SiteContentData["contato"]>) =>
    setData((d) => ({ ...d, contato: { ...d.contato, ...patch } }));
  const setLegal = (key: keyof SiteContentData["legal"], patch: Partial<LegalPage>) =>
    setData((d) => ({ ...d, legal: { ...d.legal, [key]: { ...d.legal[key], ...patch } } }));

  return (
    <form action={formAction}>
      <input type="hidden" name="payload" value={JSON.stringify(data)} readOnly />

      <p className="admin-help">
        Dica: use <code>**texto**</code> para deixar em <strong>negrito</strong>.
        As mudanças aparecem no site logo após salvar.
      </p>

      {/* ------------------------------------------------------- Home: Hero */}
      <details className="admin-form-card admin-acc" open>
        <summary className="admin-acc__summary admin-section-title">Home — Hero (topo)</summary>
        <Field label="Rótulo (eyebrow)" value={data.home.heroEyebrow} onChange={(v) => setHome({ heroEyebrow: v })} />
        <Field label="Nome (exibido grande)" value={data.home.heroName} onChange={(v) => setHome({ heroName: v })} />
        <Field label="Subtítulo (Enter quebra linha)" value={data.home.heroSubtitle} onChange={(v) => setHome({ heroSubtitle: v })} multiline />
        <Field label="Chamada (lead)" value={data.home.heroLead} onChange={(v) => setHome({ heroLead: v })} multiline />
        <Field label="Faixa 1 (verde)" value={data.home.ribbon1} onChange={(v) => setHome({ ribbon1: v })} />
        <Field label="Faixa 2 (bege)" value={data.home.ribbon2} onChange={(v) => setHome({ ribbon2: v })} />
      </details>

      {/* ------------------------------------------ Home: credenciais (tarja) */}
      <details className="admin-form-card admin-acc">
        <summary className="admin-acc__summary admin-section-title">Home — Credenciais (tarja)</summary>
        <CredsEditor creds={data.home.creds} onChange={(creds) => setHome({ creds })} />
      </details>

      {/* ------------------------------------------- Home: faixa da Comenda */}
      <details className="admin-form-card admin-acc">
        <summary className="admin-acc__summary admin-section-title">Home — Faixa da Comenda</summary>
        <Field label="Rótulo" value={data.home.comendaEyebrow} onChange={(v) => setHome({ comendaEyebrow: v })} />
        <Field label="Título" value={data.home.comendaTitle} onChange={(v) => setHome({ comendaTitle: v })} />
        <Field label="Rodapé (fonte)" value={data.home.comendaMeta} onChange={(v) => setHome({ comendaMeta: v })} />
      </details>

      {/* --------------------------------------- Home: propostas + marquee */}
      <details className="admin-form-card admin-acc">
        <summary className="admin-acc__summary admin-section-title">Home — Propostas (cabeçalho) &amp; Marquee</summary>
        <Field label="Rótulo das propostas" value={data.home.propostasEyebrow} onChange={(v) => setHome({ propostasEyebrow: v })} />
        <Field label="Título — linha 1" value={data.home.propostasTitle1} onChange={(v) => setHome({ propostasTitle1: v })} />
        <Field label="Título — linha 2 (destaque verde)" value={data.home.propostasTitle2} onChange={(v) => setHome({ propostasTitle2: v })} />
        <ListEditor label="Marquee (frases que passam na faixa)" items={data.home.marquee} onChange={(marquee) => setHome({ marquee })} addLabel="+ Frase" />
      </details>

      {/* -------------------------------------------- Home: CTA "Faça parte" */}
      <details className="admin-form-card admin-acc">
        <summary className="admin-acc__summary admin-section-title">Home — Chamada “Faça parte da tropa”</summary>
        <Field label="Rótulo" value={data.home.ctaEyebrow} onChange={(v) => setHome({ ctaEyebrow: v })} />
        <Field label="Título — linha 1" value={data.home.ctaTitle1} onChange={(v) => setHome({ ctaTitle1: v })} />
        <Field label="Título — linha 2 (destaque)" value={data.home.ctaTitle2} onChange={(v) => setHome({ ctaTitle2: v })} />
        <Field label="Texto" value={data.home.ctaLead} onChange={(v) => setHome({ ctaLead: v })} multiline />
      </details>

      {/* ---------------------------------------------------- Home: "Por que" */}
      <details className="admin-form-card admin-acc">
        <summary className="admin-acc__summary admin-section-title">
          Home — “Por que entrar para a política?”
        </summary>
        <Field
          label="Frase de topo"
          value={data.why.caption}
          onChange={(v) => setWhy({ caption: v })}
          multiline
        />
        <Field
          label="Rótulo (eyebrow)"
          value={data.why.eyebrow}
          onChange={(v) => setWhy({ eyebrow: v })}
        />
        <ListEditor
          label="Parágrafos"
          items={data.why.paragraphs}
          onChange={(paragraphs) => setWhy({ paragraphs })}
          multiline
          addLabel="+ Parágrafo"
        />
        <ListEditor
          label="Selos sobre a foto"
          items={data.why.targets}
          onChange={(targets) => setWhy({ targets })}
          addLabel="+ Selo"
        />
      </details>

      {/* ----------------------------------------------------------- Manifesto */}
      <details className="admin-form-card admin-acc">
        <summary className="admin-acc__summary admin-section-title">Manifesto</summary>
        <Field
          label="Rótulo (eyebrow)"
          value={data.manifesto.eyebrow}
          onChange={(v) => setManifesto({ eyebrow: v })}
        />
        <Field
          label="Título — 1ª linha"
          value={data.manifesto.titleLine1}
          onChange={(v) => setManifesto({ titleLine1: v })}
        />
        <Field
          label="Título — palavra em destaque"
          value={data.manifesto.titleEm}
          onChange={(v) => setManifesto({ titleEm: v })}
        />
        <Field
          label="Título — 3ª linha"
          value={data.manifesto.titleLine2}
          onChange={(v) => setManifesto({ titleLine2: v })}
        />
        <ListEditor
          label="Parágrafos"
          items={data.manifesto.paragraphs}
          onChange={(paragraphs) => setManifesto({ paragraphs })}
          multiline
          addLabel="+ Parágrafo"
        />
        <StatsEditor
          stats={data.manifesto.stats}
          onChange={(stats) => setManifesto({ stats })}
        />
      </details>

      {/* --------------------------------------------------------- Sobre: bio */}
      <details className="admin-form-card admin-acc">
        <summary className="admin-acc__summary admin-section-title">Sobre — Biografia</summary>
        <Field
          label="Rótulo (eyebrow)"
          value={data.bio.eyebrow}
          onChange={(v) => setBio({ eyebrow: v })}
        />
        <Field
          label="Título"
          value={data.bio.title}
          onChange={(v) => setBio({ title: v })}
        />
        <ListEditor
          label="Parágrafos"
          items={data.bio.paragraphs}
          onChange={(paragraphs) => setBio({ paragraphs })}
          multiline
          addLabel="+ Parágrafo"
        />
        <Field
          label="Frase em destaque (citação)"
          value={data.bio.quote}
          onChange={(v) => setBio({ quote: v })}
          multiline
        />
        <Field
          label="Parágrafo de fechamento"
          value={data.bio.closing}
          onChange={(v) => setBio({ closing: v })}
          multiline
        />
      </details>

      {/* -------------------------------------------------- Sobre: trajetória */}
      <details className="admin-form-card admin-acc">
        <summary className="admin-acc__summary admin-section-title">Sobre — Trajetória</summary>
        <StepsEditor steps={data.trajetoria.steps} onChange={setSteps} />
      </details>

      {/* ----------------------------------------------------- Sobre: comenda */}
      <details className="admin-form-card admin-acc">
        <summary className="admin-acc__summary admin-section-title">Sobre — Comenda / Honraria</summary>
        <Field
          label="Rótulo (eyebrow)"
          value={data.comenda.eyebrow}
          onChange={(v) => setComenda({ eyebrow: v })}
        />
        <Field
          label="Título"
          value={data.comenda.title}
          onChange={(v) => setComenda({ title: v })}
        />
        <Field
          label="Descrição"
          value={data.comenda.desc}
          onChange={(v) => setComenda({ desc: v })}
          multiline
        />
        <Field
          label="Rodapé (fonte/nº do projeto)"
          value={data.comenda.meta}
          onChange={(v) => setComenda({ meta: v })}
        />
      </details>

      {/* ---------------------------------------------------- Sobre: formação */}
      <details className="admin-form-card admin-acc">
        <summary className="admin-acc__summary admin-section-title">Sobre — Formação &amp; Reconhecimentos</summary>
        <ListEditor
          label="Formação"
          items={data.creds.formacao}
          onChange={(formacao) => setCreds({ formacao })}
          addLabel="+ Item"
        />
        <ListEditor
          label="Especializações"
          items={data.creds.especializacoes}
          onChange={(especializacoes) => setCreds({ especializacoes })}
          addLabel="+ Item"
        />
        <ListEditor
          label="Honrarias"
          items={data.creds.honrarias}
          onChange={(honrarias) => setCreds({ honrarias })}
          addLabel="+ Item"
        />
      </details>

      {/* --------------------------------------------- Seja um Apoiador (/tropa) */}
      <details className="admin-form-card admin-acc">
        <summary className="admin-acc__summary admin-section-title">Seja um Apoiador (/tropa)</summary>
        <Field label="Título (use *palavra* p/ destaque)" value={data.tropa.heroTitle} onChange={(v) => setTropa({ heroTitle: v })} />
        <Field label="Chamada" value={data.tropa.heroLead} onChange={(v) => setTropa({ heroLead: v })} multiline />
        <Field label="Título do formulário" value={data.tropa.formTitle} onChange={(v) => setTropa({ formTitle: v })} />
        <Field label="Texto do formulário" value={data.tropa.formText} onChange={(v) => setTropa({ formText: v })} multiline />
      </details>

      {/* ------------------------------------------------- Quero Ajudar (/ajudar) */}
      <details className="admin-form-card admin-acc">
        <summary className="admin-acc__summary admin-section-title">Quero Ajudar (/ajudar)</summary>
        <Field label="Rótulo" value={data.ajudar.heroEyebrow} onChange={(v) => setAjudar({ heroEyebrow: v })} />
        <Field label="Título (use *palavra* p/ destaque)" value={data.ajudar.heroTitle} onChange={(v) => setAjudar({ heroTitle: v })} />
        <Field label="Chamada" value={data.ajudar.heroLead} onChange={(v) => setAjudar({ heroLead: v })} multiline />
        <Field label="Aviso legal (⚖️) — use **negrito**" value={data.ajudar.legalAlert} onChange={(v) => setAjudar({ legalAlert: v })} multiline />
        <label className="admin-field__label">Cards (Divulgue / Voluntário / Ideias)</label>
        <IconCardsEditor cards={data.ajudar.cards} onChange={(cards) => setAjudar({ cards })} />
        <Field label="Rótulo do bloco de apoio" value={data.ajudar.supportEyebrow} onChange={(v) => setAjudar({ supportEyebrow: v })} />
        <Field label="Título do bloco (*destaque*, Enter quebra)" value={data.ajudar.supportTitle} onChange={(v) => setAjudar({ supportTitle: v })} multiline />
        <Field label="Texto do bloco de apoio — **negrito**" value={data.ajudar.supportLead} onChange={(v) => setAjudar({ supportLead: v })} multiline />
        <Field label="Rodapé de confiança — **negrito**" value={data.ajudar.supportTrust} onChange={(v) => setAjudar({ supportTrust: v })} multiline />
        <Field label="Título “Comece agora”" value={data.ajudar.comeceTitle} onChange={(v) => setAjudar({ comeceTitle: v })} />
        <Field label="Texto “Comece agora”" value={data.ajudar.comeceText} onChange={(v) => setAjudar({ comeceText: v })} multiline />
      </details>

      {/* ------------------------------------------------ Nossas Mídias (/midias) */}
      <details className="admin-form-card admin-acc">
        <summary className="admin-acc__summary admin-section-title">Nossas Mídias (/midias)</summary>
        <Field label="Rótulo" value={data.midias.heroEyebrow} onChange={(v) => setMidias({ heroEyebrow: v })} />
        <Field label="Título (use *palavra* p/ destaque)" value={data.midias.heroTitle} onChange={(v) => setMidias({ heroTitle: v })} />
        <Field label="Chamada" value={data.midias.heroLead} onChange={(v) => setMidias({ heroLead: v })} multiline />
        <label className="admin-field__label">Redes sociais (ícone, nome, legenda e link)</label>
        <SocialEditor canais={data.midias.canais} onChange={(canais) => setMidias({ canais })} />
        <Field label="Título do bloco final" value={data.midias.ctaTitle} onChange={(v) => setMidias({ ctaTitle: v })} />
        <Field label="Texto do bloco final" value={data.midias.ctaText} onChange={(v) => setMidias({ ctaText: v })} multiline />
      </details>

      {/* -------------------------------------------------------- Contato (/contato) */}
      <details className="admin-form-card admin-acc">
        <summary className="admin-acc__summary admin-section-title">Contato (/contato)</summary>
        <Field label="Rótulo" value={data.contato.heroEyebrow} onChange={(v) => setContato({ heroEyebrow: v })} />
        <Field label="Título (use *palavra* p/ destaque)" value={data.contato.heroTitle} onChange={(v) => setContato({ heroTitle: v })} />
        <Field label="Chamada" value={data.contato.heroLead} onChange={(v) => setContato({ heroLead: v })} multiline />
        <Field label="Base — rótulo" value={data.contato.baseLabel} onChange={(v) => setContato({ baseLabel: v })} />
        <Field label="Base — valor" value={data.contato.baseValue} onChange={(v) => setContato({ baseValue: v })} />
        <Field label="E-mail — rótulo" value={data.contato.emailLabel} onChange={(v) => setContato({ emailLabel: v })} />
        <Field label="E-mail — endereço" value={data.contato.emailValue} onChange={(v) => setContato({ emailValue: v })} />
        <Field label="WhatsApp — rótulo" value={data.contato.whatsLabel} onChange={(v) => setContato({ whatsLabel: v })} />
        <Field label="WhatsApp — valor" value={data.contato.whatsValue} onChange={(v) => setContato({ whatsValue: v })} />
        <Field label="Título do formulário" value={data.contato.formTitle} onChange={(v) => setContato({ formTitle: v })} />
        <Field label="Texto do formulário" value={data.contato.formText} onChange={(v) => setContato({ formText: v })} multiline />
      </details>

      {/* ---------------------------------------------------------- Páginas legais */}
      <LegalCard label="Legal — Política de Privacidade" page={data.legal.privacidade} onChange={(p) => setLegal("privacidade", p)} />
      <LegalCard label="Legal — Termos de Uso" page={data.legal.termos} onChange={(p) => setLegal("termos", p)} />
      <LegalCard label="Legal — Política de Cookies" page={data.legal.cookies} onChange={(p) => setLegal("cookies", p)} />
      <LegalCard label="Legal — Portal LGPD" page={data.legal.lgpd} onChange={(p) => setLegal("lgpd", p)} />
      <LegalCard label="Legal — Regras e Normas" page={data.legal.regras} onChange={(p) => setLegal("regras", p)} />

      <div className="admin-savebar">
        <span className="admin-savebar__msg">
          {state.error ? (
            <span className="admin-savebar__msg--fail">{state.error}</span>
          ) : state.ok ? (
            <span className="admin-savebar__msg--ok">
              ✓ Conteúdo salvo! As mudanças já aparecem no site.
            </span>
          ) : (
            "As mudanças aparecem no site logo após salvar."
          )}
        </span>
        <button type="submit" className="admin-btn" disabled={pending}>
          {pending ? "Salvando…" : "Salvar conteúdo"}
        </button>
      </div>
    </form>
  );
}

// ------------------------------------------------------------- campo simples
function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="admin-field" style={{ marginBottom: "1rem" }}>
      <label className="admin-field__label">{label}</label>
      {multiline ? (
        <textarea
          className="admin-field__input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
        />
      ) : (
        <input
          className="admin-field__input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

// ------------------------------------------------- lista de textos (add/remove)
function ListEditor({
  label,
  items,
  onChange,
  multiline,
  addLabel,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  multiline?: boolean;
  addLabel?: string;
}) {
  const update = (i: number, v: string) =>
    onChange(items.map((it, j) => (j === i ? v : it)));
  const add = () => onChange([...items, ""]);
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i));

  return (
    <div className="admin-field" style={{ marginBottom: "1.25rem" }}>
      <label className="admin-field__label">{label}</label>
      <div className="flex flex-col gap-2">
        {items.map((it, i) => (
          <div
            key={i}
            style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}
          >
            {multiline ? (
              <textarea
                className="admin-field__input"
                value={it}
                onChange={(e) => update(i, e.target.value)}
                rows={2}
              />
            ) : (
              <input
                className="admin-field__input"
                value={it}
                onChange={(e) => update(i, e.target.value)}
              />
            )}
            <button
              type="button"
              className="admin-btn admin-btn--ghost admin-btn--sm"
              onClick={() => remove(i)}
              aria-label={`Remover item ${i + 1}`}
              style={{ flexShrink: 0 }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="admin-linkbtn"
        onClick={add}
        style={{ marginTop: "0.5rem" }}
      >
        {addLabel ?? "+ Adicionar"}
      </button>
    </div>
  );
}

// -------------------------------------------- editor dos passos da trajetória
function StepsEditor({
  steps,
  onChange,
}: {
  steps: TrajetoriaStep[];
  onChange: (steps: TrajetoriaStep[]) => void;
}) {
  const update = (i: number, patch: Partial<TrajetoriaStep>) =>
    onChange(steps.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const add = () =>
    onChange([
      ...steps,
      { label: String(steps.length + 1).padStart(2, "0"), title: "", text: "" },
    ]);
  const remove = (i: number) => onChange(steps.filter((_, j) => j !== i));

  return (
    <div className="flex flex-col gap-3">
      {steps.map((s, i) => (
        <div key={i} className="admin-card" style={{ padding: "1rem" }}>
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              alignItems: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <div className="admin-field" style={{ width: "4.5rem" }}>
              <label className="admin-field__label">Nº</label>
              <input
                className="admin-field__input"
                value={s.label}
                onChange={(e) => update(i, { label: e.target.value })}
              />
            </div>
            <div className="admin-field" style={{ flex: "1 1 12rem" }}>
              <label className="admin-field__label">Título</label>
              <input
                className="admin-field__input"
                value={s.title}
                onChange={(e) => update(i, { title: e.target.value })}
              />
            </div>
            <button
              type="button"
              className="admin-btn admin-btn--ghost admin-btn--sm"
              onClick={() => remove(i)}
            >
              Remover
            </button>
          </div>
          <div className="admin-field" style={{ marginTop: "0.75rem" }}>
            <label className="admin-field__label">Texto</label>
            <textarea
              className="admin-field__input"
              value={s.text}
              onChange={(e) => update(i, { text: e.target.value })}
              rows={2}
            />
          </div>
        </div>
      ))}
      <button type="button" className="admin-linkbtn" onClick={add}>
        + Passo
      </button>
    </div>
  );
}

// ------------------------------------ números em destaque do Manifesto (add/remove)
function StatsEditor({
  stats,
  onChange,
}: {
  stats: ManifestoStat[];
  onChange: (stats: ManifestoStat[]) => void;
}) {
  const update = (i: number, patch: Partial<ManifestoStat>) =>
    onChange(stats.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const add = () => onChange([...stats, { value: "", label: "" }]);
  const remove = (i: number) => onChange(stats.filter((_, j) => j !== i));

  return (
    <div className="admin-field" style={{ marginBottom: "1rem" }}>
      <label className="admin-field__label">Números em destaque</label>
      <div className="flex flex-col gap-2">
        {stats.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
            <div className="admin-field" style={{ width: "6.5rem" }}>
              <label className="admin-field__label">Número</label>
              <input
                className="admin-field__input"
                value={s.value}
                onChange={(e) => update(i, { value: e.target.value })}
              />
            </div>
            <div className="admin-field" style={{ flex: "1 1 10rem" }}>
              <label className="admin-field__label">Legenda</label>
              <input
                className="admin-field__input"
                value={s.label}
                onChange={(e) => update(i, { label: e.target.value })}
              />
            </div>
            <button
              type="button"
              className="admin-btn admin-btn--ghost admin-btn--sm"
              onClick={() => remove(i)}
              aria-label={`Remover número ${i + 1}`}
              style={{ flexShrink: 0 }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="admin-linkbtn"
        onClick={add}
        style={{ marginTop: "0.5rem" }}
      >
        + Número
      </button>
    </div>
  );
}

// --------------------------------------- credenciais da home (num/título/texto)
function CredsEditor({
  creds,
  onChange,
}: {
  creds: CredItem[];
  onChange: (creds: CredItem[]) => void;
}) {
  const update = (i: number, patch: Partial<CredItem>) =>
    onChange(creds.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const add = () => onChange([...creds, { num: "", title: "", text: "" }]);
  const remove = (i: number) => onChange(creds.filter((_, j) => j !== i));

  return (
    <div className="flex flex-col gap-3">
      {creds.map((c, i) => (
        <div key={i} className="admin-card" style={{ padding: "1rem" }}>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
            <div className="admin-field" style={{ width: "7rem" }}>
              <label className="admin-field__label">Número/sigla</label>
              <input className="admin-field__input" value={c.num} onChange={(e) => update(i, { num: e.target.value })} />
            </div>
            <div className="admin-field" style={{ flex: "1 1 12rem" }}>
              <label className="admin-field__label">Título</label>
              <input className="admin-field__input" value={c.title} onChange={(e) => update(i, { title: e.target.value })} />
            </div>
            <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => remove(i)}>
              Remover
            </button>
          </div>
          <div className="admin-field" style={{ marginTop: "0.75rem" }}>
            <label className="admin-field__label">Texto</label>
            <textarea className="admin-field__input" value={c.text} onChange={(e) => update(i, { text: e.target.value })} rows={2} />
          </div>
        </div>
      ))}
      <button type="button" className="admin-linkbtn" onClick={add}>
        + Credencial
      </button>
    </div>
  );
}

// ------------------------------------------- cards com ícone (ajudar): icon/título/texto
function IconCardsEditor({
  cards,
  onChange,
}: {
  cards: IconCard[];
  onChange: (cards: IconCard[]) => void;
}) {
  const update = (i: number, patch: Partial<IconCard>) =>
    onChange(cards.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const add = () => onChange([...cards, { icon: "", title: "", text: "" }]);
  const remove = (i: number) => onChange(cards.filter((_, j) => j !== i));

  return (
    <div className="flex flex-col gap-3" style={{ marginBottom: "1.25rem" }}>
      {cards.map((c, i) => (
        <div key={i} className="admin-card" style={{ padding: "1rem" }}>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
            <div className="admin-field" style={{ width: "5.5rem" }}>
              <label className="admin-field__label">Ícone</label>
              <input className="admin-field__input" value={c.icon} onChange={(e) => update(i, { icon: e.target.value })} />
            </div>
            <div className="admin-field" style={{ flex: "1 1 12rem" }}>
              <label className="admin-field__label">Título</label>
              <input className="admin-field__input" value={c.title} onChange={(e) => update(i, { title: e.target.value })} />
            </div>
            <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => remove(i)}>
              Remover
            </button>
          </div>
          <div className="admin-field" style={{ marginTop: "0.75rem" }}>
            <label className="admin-field__label">Texto</label>
            <textarea className="admin-field__input" value={c.text} onChange={(e) => update(i, { text: e.target.value })} rows={2} />
          </div>
        </div>
      ))}
      <button type="button" className="admin-linkbtn" onClick={add}>
        + Card
      </button>
    </div>
  );
}

// ------------------------------------------ redes sociais (/midias): ícone/nome/handle/URL
function SocialEditor({
  canais,
  onChange,
}: {
  canais: SocialChannel[];
  onChange: (canais: SocialChannel[]) => void;
}) {
  const update = (i: number, patch: Partial<SocialChannel>) =>
    onChange(canais.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const add = () => onChange([...canais, { icon: "", name: "", handle: "", href: "" }]);
  const remove = (i: number) => onChange(canais.filter((_, j) => j !== i));

  return (
    <div className="flex flex-col gap-3" style={{ marginBottom: "1.25rem" }}>
      {canais.map((c, i) => (
        <div key={i} className="admin-card" style={{ padding: "1rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div className="admin-field" style={{ width: "4.5rem" }}>
              <label className="admin-field__label">Ícone</label>
              <input className="admin-field__input" value={c.icon} onChange={(e) => update(i, { icon: e.target.value })} />
            </div>
            <div className="admin-field" style={{ flex: "1 1 8rem" }}>
              <label className="admin-field__label">Nome</label>
              <input className="admin-field__input" value={c.name} onChange={(e) => update(i, { name: e.target.value })} />
            </div>
            <div className="admin-field" style={{ flex: "1 1 8rem" }}>
              <label className="admin-field__label">Legenda/handle</label>
              <input className="admin-field__input" value={c.handle} onChange={(e) => update(i, { handle: e.target.value })} />
            </div>
            <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => remove(i)}>
              Remover
            </button>
          </div>
          <div className="admin-field" style={{ marginTop: "0.75rem" }}>
            <label className="admin-field__label">Link (URL)</label>
            <input className="admin-field__input" value={c.href} onChange={(e) => update(i, { href: e.target.value })} />
          </div>
        </div>
      ))}
      <button type="button" className="admin-linkbtn" onClick={add}>
        + Rede
      </button>
    </div>
  );
}

// ------------------------------------------- página legal: rótulo/título/chamada + corpo markdown
function LegalCard({
  label,
  page,
  onChange,
}: {
  label: string;
  page: LegalPage;
  onChange: (patch: Partial<LegalPage>) => void;
}) {
  return (
    <details className="admin-form-card admin-acc">
      <summary className="admin-acc__summary admin-section-title">{label}</summary>
      <Field label="Rótulo" value={page.eyebrow} onChange={(v) => onChange({ eyebrow: v })} />
      <Field label="Título (use *palavra* p/ destaque)" value={page.title} onChange={(v) => onChange({ title: v })} />
      <Field label="Chamada (opcional)" value={page.lead} onChange={(v) => onChange({ lead: v })} multiline />
      <div className="admin-field" style={{ marginBottom: "1rem" }}>
        <label className="admin-field__label">
          Conteúdo — markdown: <code>## título</code> · <code>- item</code> ·{" "}
          <code>**negrito**</code> · <code>[texto](url)</code>
        </label>
        <textarea
          className="admin-field__input"
          value={page.body}
          onChange={(e) => onChange({ body: e.target.value })}
          rows={14}
          style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "0.85rem", lineHeight: 1.5 }}
        />
      </div>
    </details>
  );
}
