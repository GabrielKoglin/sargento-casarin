"use client";

import { useActionState, useState } from "react";
import { login, type LoginState } from "./actions";
import "../admin.css";

const INITIAL_STATE: LoginState = { error: null };

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(login, INITIAL_STATE);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="admin-scope admin-login">
      <div className="admin-login__card">
        <header className="admin-login__brand">
          <span className="admin-login__eyebrow">Painel Restrito</span>
          <h1 className="admin-login__title">Sargento Casarin</h1>
          <p className="admin-login__subtitle">Acesso administrativo</p>
        </header>

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

          {state?.error ? (
            <p role="alert" className="admin-login__error">
              {state.error}
            </p>
          ) : null}

          <button type="submit" className="admin-btn" disabled={pending}>
            {pending ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
