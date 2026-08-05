"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { saveContact, type ContactFormState } from "@/app/actions";

const initialState: ContactFormState = { status: "idle" };

type ContactFormProps = {
  origin: string;
  withMessage?: boolean;
  submitLabel: string;
  successTitle: string;
  successText: string;
};

export function ContactForm({
  origin,
  withMessage = false,
  submitLabel,
  successTitle,
  successText,
}: ContactFormProps) {
  const [state, formAction, pending] = useActionState(saveContact, initialState);
  const successTitleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      successTitleRef.current?.focus();
    }
  }, [state.status]);

  if (state.status === "success") {
    return (
      <div className="tropa-res-ok">
        <div className="res-title" ref={successTitleRef} tabIndex={-1}>
          {successTitle}
        </div>
        <p className="res-sub">{successText}</p>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="origin" value={origin} />
      <div className="hp-field" aria-hidden="true">
        <label htmlFor={`website-${origin}`}>Não preencha este campo</label>
        <input type="text" id={`website-${origin}`} name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="form-grid">
        <div className="fg">
          <label htmlFor={`name-${origin}`}>Nome completo *</label>
          <input type="text" id={`name-${origin}`} name="name" required autoComplete="name" />
        </div>
        <div className="fg">
          <label htmlFor={`email-${origin}`}>E-mail *</label>
          <input type="email" id={`email-${origin}`} name="email" required autoComplete="email" />
        </div>
        <div className="fg">
          <label htmlFor={`phone-${origin}`}>Telefone / WhatsApp *</label>
          <input type="tel" id={`phone-${origin}`} name="phone" required autoComplete="tel" />
        </div>
        <div className="fg">
          <label htmlFor={`city-${origin}`}>Cidade *</label>
          <input type="text" id={`city-${origin}`} name="city" required autoComplete="address-level2" />
        </div>
        {withMessage && (
          <div className="fg full">
            <label htmlFor={`message-${origin}`}>Mensagem</label>
            <textarea id={`message-${origin}`} name="message" rows={5} />
          </div>
        )}
      </div>

      <div className="form-consent">
        <input type="checkbox" id={`consent-${origin}`} name="consent" required />
        <label htmlFor={`consent-${origin}`}>
          Autorizo o uso dos meus dados para receber comunicações da pré-campanha, conforme a{" "}
          <Link href="/privacidade">Política de Privacidade</Link>. Você pode sair da lista
          quando quiser.
        </label>
      </div>

      {state.status === "error" && (
        <p className="form-error" role="alert">
          {state.message}
        </p>
      )}

      <button type="submit" className="btn btn-gold" disabled={pending}>
        {pending ? "Enviando..." : submitLabel}
      </button>
    </form>
  );
}
