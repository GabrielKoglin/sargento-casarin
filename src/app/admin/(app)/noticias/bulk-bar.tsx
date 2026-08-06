"use client";

// ============================================================================
// noticias/bulk-bar.tsx — moderação em MASSA da fila (client)
// ============================================================================
// A page.tsx é um Server Component: renderiza a tabela e, em cada linha, um
// checkbox <input name="ids" value={id} form="bulk-form"> ASSOCIADO por atributo
// `form=` ao <form id="bulk-form"> que vive AQUI, acima da tabela. Usar o
// atributo `form` (em vez de embrulhar a <table> num <form>) evita aninhar
// formulários — as ações individuais de cada linha já são <form> próprios, e
// <form> dentro de <form> é HTML inválido.
//
// Ao submeter, `new FormData(form)` percorre `form.elements`, que INCLUI os
// elementos associados via `form=` mesmo fora da subárvore do form. Logo os
// checkboxes marcados chegam ao server action como `getAll("ids")`.
//
// Dois componentes coordenam a seleção sem estado compartilhado do React (os
// checkboxes são renderizados no server, fora daqui): ambos leem o DOM e
// escutam `change` (clique individual) + um CustomEvent (marcação em massa).
import { useEffect, useRef, useState } from "react";
import {
  approveManyNews,
  rejectManyNews,
  approveAllPending,
  rejectAllPending,
  deleteRejected,
} from "./actions";

// Contrato compartilhado com page.tsx: o id do form e o seletor dos checkboxes.
const BULK_FORM_ID = "bulk-form";
const ID_CHECKBOX_SELECTOR = `input[type="checkbox"][name="ids"][form="${BULK_FORM_ID}"]`;
// Disparado quando a marcação muda em massa (select-all) — o `change` nativo não
// dispara ao setar `.checked` via script, então avisamos os ouvintes na mão.
const SELECTION_EVENT = "news:selection-change";

type Selection = { count: number; total: number };

function readSelection(): Selection {
  if (typeof document === "undefined") return { count: 0, total: 0 };
  const boxes = document.querySelectorAll<HTMLInputElement>(ID_CHECKBOX_SELECTOR);
  let count = 0;
  boxes.forEach((box) => {
    if (box.checked) count += 1;
  });
  return { count, total: boxes.length };
}

// Assina as mudanças de seleção (clique individual + marcação em massa) e devolve
// { count, total } atual. Compartilhado por SelectAllCheckbox e BulkBar.
function useSelection(): Selection {
  const [selection, setSelection] = useState<Selection>({ count: 0, total: 0 });

  useEffect(() => {
    const update = () => setSelection(readSelection());
    update(); // estado inicial após a hidratação (SSR começa em 0/0)

    const onChange = (event: Event) => {
      const target = event.target;
      if (target instanceof HTMLInputElement && target.name === "ids") {
        update();
      }
    };
    document.addEventListener("change", onChange);
    window.addEventListener(SELECTION_EVENT, update);
    return () => {
      document.removeEventListener("change", onChange);
      window.removeEventListener(SELECTION_EVENT, update);
    };
  }, []);

  return selection;
}

// Marca/desmarca todos os checkboxes visíveis e avisa os ouvintes.
function setAllChecked(checked: boolean): void {
  const boxes = document.querySelectorAll<HTMLInputElement>(ID_CHECKBOX_SELECTOR);
  boxes.forEach((box) => {
    box.checked = checked;
  });
  window.dispatchEvent(new Event(SELECTION_EVENT));
}

// --------------------------------------------------------- select-all header --
// Checkbox do cabeçalho da tabela: "Selecionar todos desta página". Reflete o
// estado agregado (marcado / indeterminado) e alterna os checkboxes visíveis.
export function SelectAllCheckbox() {
  const ref = useRef<HTMLInputElement>(null);
  const { count, total } = useSelection();
  const allChecked = total > 0 && count === total;

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = count > 0 && count < total;
  }, [count, total]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={allChecked}
      disabled={total === 0}
      onChange={(event) => setAllChecked(event.target.checked)}
      aria-label="Selecionar todas as notícias desta página"
      title="Selecionar todas desta página"
      style={{ width: "1rem", height: "1rem", accentColor: "var(--a-green)", cursor: "pointer" }}
    />
  );
}

// ------------------------------------------------------------------- botões ---
const btnBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.4rem",
  padding: "0.4rem 0.85rem",
  borderRadius: "6px",
  border: "1px solid var(--a-line)",
  background: "transparent",
  fontFamily: "inherit",
  fontSize: "0.82rem",
  fontWeight: 600,
  cursor: "pointer",
};

const approveBtn: React.CSSProperties = {
  ...btnBase,
  border: "1px solid rgba(0,184,75,0.5)",
  background: "rgba(0,184,75,0.12)",
  color: "var(--a-green-bright)",
};
const rejectBtn: React.CSSProperties = {
  ...btnBase,
  border: "1px solid rgba(245,197,24,0.5)",
  background: "rgba(245,197,24,0.1)",
  color: "#f5c518",
};
const dangerBtn: React.CSSProperties = {
  ...btnBase,
  border: "1px solid rgba(255,90,90,0.5)",
  background: "rgba(255,90,90,0.1)",
  color: "#ff9a9a",
};
const disabledBtn: React.CSSProperties = { opacity: 0.4, cursor: "not-allowed" };

// Botão de submit que confirma via window.confirm antes de deixar o form seguir.
function ConfirmButton({
  message,
  style,
  children,
}: {
  message: string;
  style: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
      style={style}
    >
      {children}
    </button>
  );
}

// ------------------------------------------------------------------ a barra ---
export function BulkBar({
  pendingCount,
  rejectedCount,
  status,
}: {
  pendingCount: number;
  rejectedCount: number;
  status: string;
}) {
  const { count } = useSelection();
  const hasSelection = count > 0;
  const selectedLabel = count === 1 ? "1 selecionada" : `${count} selecionadas`;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.75rem",
        flexWrap: "wrap",
        marginBottom: "0.9rem",
        padding: "0.7rem 0.85rem",
        borderRadius: "8px",
        border: "1px solid var(--a-line)",
        background: "var(--a-panel)",
      }}
    >
      {/* Ações sobre a SELEÇÃO. O <form id="bulk-form"> não embrulha a tabela:
          os checkboxes das linhas se ligam a ele via `form="bulk-form"`. */}
      <form
        id={BULK_FORM_ID}
        style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", margin: 0 }}
      >
        <span
          style={{
            fontSize: "0.8rem",
            fontWeight: 700,
            color: hasSelection ? "var(--a-text)" : "var(--a-muted)",
            minWidth: "6.5rem",
          }}
        >
          {hasSelection ? selectedLabel : "Nenhuma selecionada"}
        </span>
        <button
          type="submit"
          formAction={approveManyNews}
          disabled={!hasSelection}
          style={hasSelection ? approveBtn : { ...approveBtn, ...disabledBtn }}
        >
          ✓ Aprovar selecionadas
        </button>
        <button
          type="submit"
          formAction={rejectManyNews}
          disabled={!hasSelection}
          style={hasSelection ? rejectBtn : { ...rejectBtn, ...disabledBtn }}
        >
          ✕ Rejeitar selecionadas
        </button>
      </form>

      {/* Ações sobre TODA a fila (independem da seleção e da página). Cada uma é
          um <form> irmão — NUNCA aninhado no #bulk-form. */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
        {pendingCount > 0 && (
          <>
            <form action={approveAllPending} style={{ margin: 0 }}>
              <ConfirmButton
                message={`Aprovar TODAS as ${pendingCount} notícias pendentes? Isso afeta a fila inteira, não só esta página. Todas vão ao ar no site.`}
                style={approveBtn}
              >
                Aprovar TODAS as pendentes ({pendingCount})
              </ConfirmButton>
            </form>
            <form action={rejectAllPending} style={{ margin: 0 }}>
              <ConfirmButton
                message={`Rejeitar TODAS as ${pendingCount} notícias pendentes? Isso afeta a fila inteira, não só esta página.`}
                style={rejectBtn}
              >
                Rejeitar TODAS as pendentes ({pendingCount})
              </ConfirmButton>
            </form>
          </>
        )}
        {status === "rejected" && rejectedCount > 0 && (
          <form action={deleteRejected} style={{ margin: 0 }}>
            <ConfirmButton
              message={`Excluir DEFINITIVAMENTE as ${rejectedCount} notícias rejeitadas? Esta ação não pode ser desfeita.`}
              style={dangerBtn}
            >
              🗑 Excluir todas as rejeitadas ({rejectedCount})
            </ConfirmButton>
          </form>
        )}
      </div>
    </div>
  );
}
