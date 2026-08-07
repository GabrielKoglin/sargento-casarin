"use client";

import { useActionState, useState } from "react";
import { login, verifyMfaLogin, type LoginState } from "./actions";
import "../admin.css";

const INITIAL_STATE: LoginState = { error: null, step: "password" };
// O hook do MFA começa em "mfa": a view é DERIVADA (sem efeitos) e um
// `mfaState.step === "password"` só ocorre quando a verificação manda voltar ao
// passo 1 (expirou / muitas tentativas).
const INITIAL_MFA_STATE: LoginState = { error: null, step: "mfa" };

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(login, INITIAL_STATE);
  const [mfaState, mfaAction, mfaPending] = useActionState(
    verifyMfaLogin,
    INITIAL_MFA_STATE,
  );
  const [showPassword, setShowPassword] = useState(false);

  // View derivada (evita setState-em-effect): mostra a etapa do código quando o
  // login pediu MFA E a verificação ainda não mandou voltar ao passo 1.
  const view: "password" | "mfa" =
    state.step === "mfa" && mfaState.step !== "password" ? "mfa" : "password";
  // No passo 1, mostra o erro do login OU o aviso de "verificação expirou"
  // (quando a verificação devolveu a UI para cá).
  const passwordError =
    state.error ?? (mfaState.step === "password" ? mfaState.error : null);

  return (
    <div className="admin-scope admin-login">
      <div className="admin-login__card">
        <header className="admin-login__brand">
          <span className="admin-login__eyebrow">Painel Restrito</span>
          <h1 className="admin-login__title">Sargento Casarin</h1>
          <p className="admin-login__subtitle">Acesso administrativo</p>
        </header>

        {view === "password" ? (
          <form action={formAction} className="admin-login__form" noValidate>
            <div className="admin-field">
              <label htmlFor="email" className="admin-field__label">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                className="admin-field__input"
                placeholder="voce@exemplo.com"
              />
            </div>

            <div className="admin-field">
              <label htmlFor="password" className="admin-field__label">
                Senha
              </label>
              <div className="admin-pw-wrap">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="admin-field__input admin-field__input--pw"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="admin-pw-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={showPassword}
                  title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {passwordError ? (
              <p role="alert" className="admin-login__error">
                {passwordError}
              </p>
            ) : null}

            <button type="submit" className="admin-btn" disabled={pending}>
              {pending ? "Entrando…" : "Entrar"}
            </button>
          </form>
        ) : (
          <form action={mfaAction} className="admin-login__form" noValidate>
            <p className="admin-login__mfa-hint">
              Verificação em duas etapas ativa. Abra seu app autenticador
              (Google Authenticator, Authy…) e digite o código de 6 dígitos.
            </p>
            <div className="admin-field">
              <label htmlFor="code" className="admin-field__label">
                Código de verificação
              </label>
              <input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoComplete="one-time-code"
                autoFocus
                required
                className="admin-field__input admin-otp-input"
                placeholder="000000"
              />
            </div>

            {mfaState.error ? (
              <p role="alert" className="admin-login__error">
                {mfaState.error}
              </p>
            ) : null}

            <button type="submit" className="admin-btn" disabled={mfaPending}>
              {mfaPending ? "Verificando…" : "Verificar"}
            </button>
            <button
              type="button"
              className="admin-linkbtn"
              onClick={() => window.location.reload()}
            >
              Voltar e entrar com outra conta
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
