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
import type { SiteContentData, TrajetoriaStep } from "@/lib/site-content";

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

  return (
    <form action={formAction}>
      <input type="hidden" name="payload" value={JSON.stringify(data)} readOnly />

      <p className="admin-help">
        Dica: use <code>**texto**</code> para deixar em <strong>negrito</strong>.
        As mudanças aparecem no site logo após salvar.
      </p>

      {/* ---------------------------------------------------- Home: "Por que" */}
      <section className="admin-form-card">
        <h2 className="admin-section-title">
          Home — “Por que entrar para a política?”
        </h2>
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
      </section>

      {/* --------------------------------------------------------- Sobre: bio */}
      <section className="admin-form-card">
        <h2 className="admin-section-title">Sobre — Biografia</h2>
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
      </section>

      {/* -------------------------------------------------- Sobre: trajetória */}
      <section className="admin-form-card">
        <h2 className="admin-section-title">Sobre — Trajetória</h2>
        <StepsEditor steps={data.trajetoria.steps} onChange={setSteps} />
      </section>

      {/* ----------------------------------------------------- Sobre: comenda */}
      <section className="admin-form-card">
        <h2 className="admin-section-title">Sobre — Comenda / Honraria</h2>
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
      </section>

      {/* ---------------------------------------------------- Sobre: formação */}
      <section className="admin-form-card">
        <h2 className="admin-section-title">Sobre — Formação &amp; Reconhecimentos</h2>
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
      </section>

      {state.error ? (
        <p className="admin-notice admin-notice--fail">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="admin-notice admin-notice--ok">
          Conteúdo salvo! As mudanças já aparecem no site.
        </p>
      ) : null}

      <button
        type="submit"
        className="admin-btn"
        disabled={pending}
        style={{ marginTop: "0.5rem" }}
      >
        {pending ? "Salvando…" : "Salvar conteúdo"}
      </button>
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
