"use client";

// Ativação/desativação do MFA da própria conta. Client para orquestrar os 3
// useActionState (gerar QR → confirmar → desativar). Após confirmar/desativar,
// a action revalida /admin/seguranca e a prop `enabled` chega atualizada.
import { useActionState } from "react";
import {
  beginMfaSetup,
  confirmMfaSetup,
  disableMfa,
  type MfaBeginState,
  type MfaConfirmState,
  type MfaDisableState,
} from "./actions";

const INITIAL_BEGIN: MfaBeginState = { error: null, qr: null, secret: null };
const INITIAL_CONFIRM: MfaConfirmState = { error: null, ok: false };
const INITIAL_DISABLE: MfaDisableState = { error: null, ok: false };

export function MfaSetup({ enabled }: { enabled: boolean }) {
  const [begin, beginAction, beginPending] = useActionState(beginMfaSetup, INITIAL_BEGIN);
  const [confirm, confirmAction, confirmPending] = useActionState(confirmMfaSetup, INITIAL_CONFIRM);
  const [disable, disableAction, disablePending] = useActionState(disableMfa, INITIAL_DISABLE);

  if (enabled) {
    return (
      <article className="admin-card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <p className="admin-note" style={{ margin: 0 }}>
          <strong>Verificação em duas etapas ativa.</strong> Ao entrar, será
          pedido um código do seu app autenticador.
        </p>
        <form action={disableAction} className="admin-member__reset" noValidate>
          <input
            name="code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            autoComplete="one-time-code"
            required
            placeholder="Código atual do app"
            className="admin-field__input admin-field__input--sm admin-otp-input"
          />
          <button
            type="submit"
            className="admin-btn admin-btn--sm admin-btn--danger"
            disabled={disablePending}
          >
            {disablePending ? "Desativando…" : "Desativar"}
          </button>
        </form>
        {disable.error ? (
          <p role="alert" className="admin-login__error">{disable.error}</p>
        ) : null}
      </article>
    );
  }

  return (
    <article className="admin-card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {!begin.qr ? (
        <>
          <p className="admin-note" style={{ margin: 0 }}>
            Proteja sua conta exigindo, além da senha, um código de 6 dígitos
            gerado no seu celular (Google Authenticator, Authy…).
          </p>
          <form action={beginAction}>
            <button type="submit" className="admin-btn" disabled={beginPending}>
              {beginPending ? "Gerando…" : "Ativar verificação em duas etapas"}
            </button>
          </form>
          {begin.error ? (
            <p role="alert" className="admin-login__error">{begin.error}</p>
          ) : null}
        </>
      ) : (
        <>
          <ol className="admin-note" style={{ margin: 0, paddingLeft: "1.1rem" }}>
            <li>Escaneie o QR code no app autenticador;</li>
            <li>sem câmera, digite o código manual abaixo;</li>
            <li>confirme com o código de 6 dígitos exibido no app.</li>
          </ol>
          <div className="admin-mfa-qr">
            {/* Data-URL gerada no servidor; next/image não se aplica a data: */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={begin.qr} alt="QR code para configurar o app autenticador" width={240} height={240} />
          </div>
          <p className="admin-mfa-secret" aria-label="Código manual">
            {begin.secret?.replace(/(.{4})/g, "$1 ").trim()}
          </p>
          <form action={confirmAction} className="admin-member__reset" noValidate>
            <input
              name="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoComplete="one-time-code"
              autoFocus
              required
              placeholder="000000"
              className="admin-field__input admin-field__input--sm admin-otp-input"
            />
            <button type="submit" className="admin-btn admin-btn--sm" disabled={confirmPending}>
              {confirmPending ? "Confirmando…" : "Confirmar ativação"}
            </button>
          </form>
          {confirm.error ? (
            <p role="alert" className="admin-login__error">{confirm.error}</p>
          ) : null}
        </>
      )}
    </article>
  );
}
