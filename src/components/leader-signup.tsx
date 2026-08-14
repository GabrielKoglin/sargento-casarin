"use client";

// ============================================================================
// leader-signup.tsx — modal "Quero ser líder apoiador" (mapa da /adesivos)
// ============================================================================
// Aberto quando a cidade buscada não tem líder. Cria um cadastro `pending`
// (saveLeaderRequest) que a equipe aprova no painel. Acessível: role=dialog,
// foco no primeiro campo, Esc e clique no fundo fecham, trava o scroll do body.
import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { saveLeaderRequest, type ContactFormState } from "@/app/actions";

export function LeaderSignup({
  city,
  cityCode,
  onClose,
}: {
  city: string;
  cityCode: string;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState<ContactFormState, FormData>(
    saveLeaderRequest,
    { status: "idle" },
  );
  const firstRef = useRef<HTMLInputElement>(null);
  const done = state.status === "success";

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    firstRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="lead-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="lead-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Ser líder apoiador em ${city}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="lead-modal__close"
          onClick={onClose}
          aria-label="Fechar"
        >
          ×
        </button>

        {done ? (
          <div className="lead-modal__done">
            <span className="lead-modal__done-ico" aria-hidden="true">✓</span>
            <h3>Cadastro recebido!</h3>
            <p>
              Obrigado por querer levar o Sargento Casarin para <strong>{city}</strong>.
              Nossa equipe vai falar com você pelo WhatsApp para combinar tudo.
            </p>
            <button type="button" className="mtmap__cta" onClick={onClose}>
              Fechar
            </button>
          </div>
        ) : (
          <>
            <span className="lead-modal__eyebrow">Líder apoiador</span>
            <h3 className="lead-modal__title">Seja o líder de {city}</h3>
            <p className="lead-modal__lead">
              O líder apoiador recebe os adesivos e ajuda a distribuir na cidade. Deixe
              seus dados que a equipe entra em contato.
            </p>

            <form action={formAction} className="lead-form">
              {/* honeypot anti-bot (escondido para humanos) */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="lead-form__hp"
              />
              <input type="hidden" name="city" value={city} />
              <input type="hidden" name="cityCode" value={cityCode} />

              <label className="lead-field">
                <span>Nome completo *</span>
                <input ref={firstRef} name="name" required maxLength={120} />
              </label>
              <label className="lead-field">
                <span>WhatsApp *</span>
                <input
                  name="whatsapp"
                  required
                  maxLength={40}
                  inputMode="tel"
                  placeholder="(65) 90000-0000"
                />
              </label>
              <label className="lead-field">
                <span>Cidade</span>
                <input value={city} readOnly className="lead-field__ro" />
              </label>

              <label className="lead-consent">
                <input type="checkbox" name="consent" value="1" required />
                <span>
                  Autorizo o uso dos meus dados para contato da campanha, conforme a{" "}
                  <Link href="/privacidade" target="_blank">
                    Política de Privacidade
                  </Link>
                  .
                </span>
              </label>

              {state.status === "error" && (
                <p className="lead-form__error" role="alert">
                  {state.message}
                </p>
              )}

              <button type="submit" className="mtmap__cta" disabled={pending}>
                {pending ? "Enviando…" : "Enviar cadastro"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
