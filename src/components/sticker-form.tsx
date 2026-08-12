"use client";

// ============================================================================
// sticker-form.tsx — formulário público de pedido de adesivo (/adesivos)
// ============================================================================
// Espelha o contact-form: useActionState + honeypot + consentimento LGPD. No
// sucesso troca por uma confirmação acessível (foco no título).
import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { saveStickerRequest, type ContactFormState } from "@/app/actions";

const initialState: ContactFormState = { status: "idle" };

export function StickerForm() {
  const [state, formAction, pending] = useActionState(saveStickerRequest, initialState);
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
          Pedido recebido! 🎖️
        </div>
        <p className="res-sub">
          Anotamos seu pedido de adesivo. Se estivermos na sua cidade, entregamos;
          se não, o apoiador responsável da sua cidade entra em contato pelo WhatsApp
          para combinar a retirada.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <div className="hp-field" aria-hidden="true">
        <label htmlFor="website-adesivo">Não preencha este campo</label>
        <input type="text" id="website-adesivo" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="form-grid">
        <div className="fg">
          <label htmlFor="name-adesivo">Nome completo *</label>
          <input type="text" id="name-adesivo" name="name" required autoComplete="name" />
        </div>
        <div className="fg">
          <label htmlFor="whatsapp-adesivo">WhatsApp *</label>
          <input
            type="tel"
            id="whatsapp-adesivo"
            name="whatsapp"
            required
            autoComplete="tel"
            placeholder="(65) 90000-0000"
          />
        </div>
        <div className="fg">
          <label htmlFor="city-adesivo">Cidade / Bairro *</label>
          <input
            type="text"
            id="city-adesivo"
            name="city"
            required
            autoComplete="address-level2"
            placeholder="Ex.: Sinop — Centro"
          />
        </div>
        <div className="fg">
          <label htmlFor="quantity-adesivo">Quantidade</label>
          <input
            type="number"
            id="quantity-adesivo"
            name="quantity"
            min={1}
            max={50}
            defaultValue={1}
          />
        </div>
        <div className="fg full">
          <label htmlFor="address-adesivo">Endereço completo *</label>
          <input
            type="text"
            id="address-adesivo"
            name="address"
            required
            autoComplete="street-address"
            placeholder="Rua, número, bairro e CEP"
          />
        </div>
      </div>

      <div className="form-consent">
        <input type="checkbox" id="consent-adesivo" name="consent" required />
        <label htmlFor="consent-adesivo">
          Autorizo o uso dos meus dados para organizar a entrega/retirada do adesivo e
          receber comunicações da campanha, conforme a{" "}
          <Link href="/privacidade">Política de Privacidade</Link>. Você pode sair da lista
          quando quiser.
        </label>
      </div>

      {state.status === "error" && (
        <p className="form-error" role="alert">
          {state.message}
        </p>
      )}

      <div style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}>
        <button type="submit" className="btn btn-gold" disabled={pending}>
          {pending ? "Enviando..." : "Quero meu adesivo ➔"}
        </button>
      </div>
    </form>
  );
}
