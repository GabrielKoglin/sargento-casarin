"use client";

// ============================================================================
// proposal-form.tsx — formulário reutilizável (criar + editar)
// ============================================================================
// Client Component: usa useActionState para exibir erros de validação vindos da
// Server Action e useState para os campos controlados. Campos controlados
// garantem que os valores digitados SOBREVIVAM a um erro de validação (o React
// 19 reseta os campos não-controlados de um <form action> após a action).
//
// O slug é gerado automaticamente a partir do título enquanto o usuário não o
// editar manualmente; ao editar, "travamos" a geração automática. O servidor
// (actions.ts) sempre re-normaliza e valida a unicidade do slug.
import { useActionState, useState, type ChangeEvent, type ReactNode } from "react";
import Link from "next/link";
import type { ProposalFormState } from "./actions";
import { slugify } from "./slug";

type ProposalAction = (
  state: ProposalFormState,
  formData: FormData,
) => Promise<ProposalFormState>;

export type ProposalFormValues = {
  title: string;
  slug: string;
  category: string;
  description: string;
  problem: string;
  objective: string;
  solution: string;
  goals: string;
  benefits: string;
  image: string;
  faq: string;
};

const EMPTY_VALUES: ProposalFormValues = {
  title: "",
  slug: "",
  category: "",
  description: "",
  problem: "",
  objective: "",
  solution: "",
  goals: "",
  benefits: "",
  image: "",
  faq: "",
};

// Sugestões de categoria (datalist) — coerentes com os ícones do site público.
const CATEGORY_SUGGESTIONS = [
  "Segurança",
  "Valorização dos profissionais",
  "Educação",
  "Mato Grosso forte",
];

// A Vercel corta requisições acima de ~4,5 MB — foto de celular estoura isso e o
// upload falha ANTES de chegar no servidor. Solução: reduzir a imagem NO
// NAVEGADOR (canvas → JPEG) antes de enviar. Acima de ~3,5 MB, encolhe para no
// máx. `maxDim` px. Best-effort: se algo falhar, mantém o arquivo original.
const RESIZE_THRESHOLD_BYTES = 3_500_000;

function resizeImageInBrowser(
  file: File,
  maxDim = 2200,
  quality = 0.82,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

export function ProposalForm({
  action,
  submitLabel,
  defaultValues,
}: {
  action: ProposalAction;
  submitLabel: string;
  defaultValues?: Partial<ProposalFormValues>;
}) {
  const initial: ProposalFormValues = { ...EMPTY_VALUES, ...defaultValues };

  const [state, formAction, pending] = useActionState<
    ProposalFormState,
    FormData
  >(action, {});

  const [values, setValues] = useState<ProposalFormValues>(initial);
  // Em edição já existe slug: não regenerar automaticamente a partir do título.
  const [slugLocked, setSlugLocked] = useState<boolean>(Boolean(initial.slug));
  const [filePreview, setFilePreview] = useState<string>("");
  const [resizing, setResizing] = useState(false);

  // Ao escolher um arquivo: reduz no navegador (se grande), substitui o arquivo
  // do input pela versão menor e mostra a pré-visualização.
  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      setFilePreview("");
      return;
    }
    let finalFile = file;
    if (file.size > RESIZE_THRESHOLD_BYTES) {
      setResizing(true);
      try {
        const blob = await resizeImageInBrowser(file);
        if (blob && blob.size < file.size) {
          const base = file.name.replace(/\.[^.]+$/, "") || "imagem";
          finalFile = new File([blob], `${base}.jpg`, { type: "image/jpeg" });
          const dt = new DataTransfer();
          dt.items.add(finalFile);
          input.files = dt.files;
        }
      } finally {
        setResizing(false);
      }
    }
    setFilePreview(URL.createObjectURL(finalFile));
  }

  const set = (name: keyof ProposalFormValues, value: string) => {
    setValues((prev) => {
      if (name === "title" && !slugLocked) {
        return { ...prev, title: value, slug: slugify(value) };
      }
      return { ...prev, [name]: value };
    });
  };

  const errorFor = (name: string) => state.fieldErrors?.[name];

  return (
    <form
      action={formAction}
      encType="multipart/form-data"
      className="flex max-w-3xl flex-col gap-5"
    >
      {state.error && (
        <p className="admin-login__error" role="alert">
          {state.error}
        </p>
      )}

      <Field label="Título" htmlFor="title" error={errorFor("title")}>
        <input
          id="title"
          name="title"
          className="admin-field__input"
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          aria-invalid={Boolean(errorFor("title"))}
        />
      </Field>

      <Field
        label="Slug (URL)"
        htmlFor="slug"
        error={errorFor("slug")}
        hint="Gerado a partir do título. Edite se quiser um endereço diferente."
      >
        <input
          id="slug"
          name="slug"
          className="admin-field__input font-mono"
          value={values.slug}
          onChange={(e) => {
            setSlugLocked(true);
            setValues((prev) => ({ ...prev, slug: e.target.value }));
          }}
          onBlur={(e) =>
            setValues((prev) => ({ ...prev, slug: slugify(e.target.value) }))
          }
          placeholder="ex.: seguranca-publica"
          aria-invalid={Boolean(errorFor("slug"))}
        />
      </Field>

      <Field
        label="Categoria"
        htmlFor="category"
        error={errorFor("category")}
      >
        <input
          id="category"
          name="category"
          list="proposal-categories"
          className="admin-field__input"
          value={values.category}
          onChange={(e) => set("category", e.target.value)}
          aria-invalid={Boolean(errorFor("category"))}
        />
        <datalist id="proposal-categories">
          {CATEGORY_SUGGESTIONS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Field>

      <Field
        label="Descrição"
        htmlFor="description"
        error={errorFor("description")}
        hint="Resumo curto exibido no card da lista de propostas."
      >
        <Textarea
          id="description"
          rows={2}
          value={values.description}
          onChange={(v) => set("description", v)}
          invalid={Boolean(errorFor("description"))}
        />
      </Field>

      <Field
        label="O problema"
        htmlFor="problem"
        error={errorFor("problem")}
      >
        <Textarea
          id="problem"
          rows={3}
          value={values.problem}
          onChange={(v) => set("problem", v)}
          invalid={Boolean(errorFor("problem"))}
        />
      </Field>

      <Field
        label="Objetivo"
        htmlFor="objective"
        error={errorFor("objective")}
      >
        <Textarea
          id="objective"
          rows={3}
          value={values.objective}
          onChange={(v) => set("objective", v)}
          invalid={Boolean(errorFor("objective"))}
        />
      </Field>

      <Field
        label="Como vamos fazer"
        htmlFor="solution"
        error={errorFor("solution")}
      >
        <Textarea
          id="solution"
          rows={3}
          value={values.solution}
          onChange={(v) => set("solution", v)}
          invalid={Boolean(errorFor("solution"))}
        />
      </Field>

      <Field
        label="Metas"
        htmlFor="goals"
        error={errorFor("goals")}
        hint="Uma meta por linha — cada linha vira um item da lista no site."
      >
        <Textarea
          id="goals"
          rows={4}
          value={values.goals}
          onChange={(v) => set("goals", v)}
          invalid={Boolean(errorFor("goals"))}
        />
      </Field>

      <Field
        label="Benefícios para você"
        htmlFor="benefits"
        error={errorFor("benefits")}
        hint="Um benefício por linha."
      >
        <Textarea
          id="benefits"
          rows={4}
          value={values.benefits}
          onChange={(v) => set("benefits", v)}
          invalid={Boolean(errorFor("benefits"))}
        />
      </Field>

      <Field
        label="Imagem de destaque — opcional"
        htmlFor="imageFile"
        error={errorFor("imageFile")}
        hint="Envie uma foto (JPG/PNG) — é otimizada automaticamente. Ou cole uma URL abaixo."
      >
        {(filePreview || values.image) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={filePreview || values.image}
            alt="Pré-visualização da imagem da proposta"
            style={{
              maxWidth: "260px",
              width: "100%",
              height: "auto",
              borderRadius: "6px",
              border: "1px solid var(--a-line)",
              marginBottom: "0.6rem",
              display: "block",
            }}
          />
        )}
        <input
          id="imageFile"
          name="imageFile"
          type="file"
          accept="image/*"
          className="admin-field__input"
          onChange={handleFileChange}
        />
        {resizing && (
          <span className="text-xs text-[var(--a-muted)]">Otimizando imagem…</span>
        )}
      </Field>

      <Field
        label="… ou cole a URL de uma imagem"
        htmlFor="image"
        error={errorFor("image")}
        hint="Alternativa ao upload. Se você enviar um arquivo acima, ele tem prioridade."
      >
        <input
          id="image"
          name="image"
          className="admin-field__input"
          value={values.image}
          onChange={(e) => set("image", e.target.value)}
          placeholder="https://…/imagem.jpg"
        />
      </Field>

      <Field
        label="FAQ — opcional"
        htmlFor="faq"
        error={errorFor("faq")}
        hint="Perguntas frequentes sobre a proposta."
      >
        <Textarea
          id="faq"
          rows={3}
          value={values.faq}
          onChange={(v) => set("faq", v)}
          invalid={Boolean(errorFor("faq"))}
        />
      </Field>

      <div className="mt-2 flex items-center gap-3">
        <button type="submit" className="admin-btn" disabled={pending}>
          {pending ? "Salvando…" : submitLabel}
        </button>
        <Link
          href="/admin/propostas"
          className="text-sm font-semibold uppercase tracking-wide text-[var(--a-muted)] transition-colors hover:text-[var(--a-text)]"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}

// --------------------------------------------------------------------- helpers
function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="admin-field">
      <label htmlFor={htmlFor} className="admin-field__label">
        {label}
        {required && <span className="text-[var(--a-danger)]"> *</span>}
      </label>
      {children}
      {hint && !error && (
        <span className="text-xs text-[var(--a-muted)]">{hint}</span>
      )}
      {error && (
        <span className="text-xs font-medium text-[var(--a-danger)]" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

function Textarea({
  id,
  rows,
  value,
  onChange,
  invalid,
}: {
  id: string;
  rows: number;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}) {
  return (
    <textarea
      id={id}
      name={id}
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={invalid}
      className="w-full rounded-[3px] border border-[var(--a-line)] bg-[#020b14] px-[0.85rem] py-2.5 font-[inherit] text-[0.95rem] leading-relaxed text-[var(--a-text)] transition-[border-color,box-shadow] duration-150 placeholder:text-[#52646d] focus-visible:border-[var(--a-green)] focus-visible:shadow-[0_0_0_3px_rgba(0,184,75,0.22)] focus-visible:outline-none"
    />
  );
}
