"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";
import "../admin.css";

const INITIAL_STATE: LoginState = { error: null };

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(login, INITIAL_STATE);

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
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="admin-field__input"
              placeholder="••••••••"
            />
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
