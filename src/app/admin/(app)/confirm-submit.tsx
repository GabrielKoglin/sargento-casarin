"use client";

// ============================================================================
// confirm-submit.tsx — botão de confirmação com MODAL estilizado do painel
// ============================================================================
// Substitui o feio window.confirm() do navegador. Renderiza um botão que, ao
// clicar, abre um modal (overlay escuro + card) pedindo confirmação; ao
// confirmar, submete o <form> (o mais próximo, ou um por `formId`). Assim as
// Server Actions de exclusão continuam iguais — só a confirmação fica bonita.
import { useEffect, useRef, useState } from "react";

type ConfirmSubmitProps = {
  children: React.ReactNode; // rótulo do botão
  className?: string;
  style?: React.CSSProperties;
  message: string;
  title?: string;
  confirmLabel?: string;
  danger?: boolean;
  /** Se definido, submete esse form por id (ex.: barra de ações em massa);
   *  senão, submete o <form> ancestral do botão. */
  formId?: string;
  disabled?: boolean;
};

export function ConfirmSubmit({
  children,
  className,
  style,
  message,
  title = "Confirmar ação",
  confirmLabel = "Confirmar",
  danger = false,
  formId,
  disabled = false,
}: ConfirmSubmitProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const submit = () => {
    const form = formId
      ? (document.getElementById(formId) as HTMLFormElement | null)
      : btnRef.current?.closest("form");
    setOpen(false);
    form?.requestSubmit();
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={className}
        style={style}
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        {children}
      </button>
      {open ? (
        <ConfirmModal
          title={title}
          message={message}
          confirmLabel={confirmLabel}
          danger={danger}
          onConfirm={submit}
          onCancel={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function ConfirmModal({
  title,
  message,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  danger: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    // Trava o scroll do fundo enquanto o modal está aberto.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onCancel]);

  return (
    <div
      className="admin-modal"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onCancel}
    >
      <div className="admin-modal__card" onClick={(e) => e.stopPropagation()}>
        <div className={`admin-modal__icon${danger ? " is-danger" : ""}`} aria-hidden="true">
          {danger ? "!" : "?"}
        </div>
        <h2 className="admin-modal__title">{title}</h2>
        <p className="admin-modal__msg">{message}</p>
        <div className="admin-modal__actions">
          <button type="button" className="admin-btn admin-btn--ghost" onClick={onCancel}>
            Cancelar
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={`admin-btn${danger ? " admin-btn--danger" : ""}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
