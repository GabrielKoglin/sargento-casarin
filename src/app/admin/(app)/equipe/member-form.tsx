"use client";

// Formulário de ADICIONAR membro da equipe. Client-only para exibir erro/sucesso
// via useActionState (mesmo padrão do login). Ao concluir com sucesso, reseta os
// campos. A action (createMember) roda no servidor e revalida a lista.
import { useActionState, useEffect, useRef } from "react";
import { createMember, type MemberFormState } from "./actions";

const INITIAL: MemberFormState = { error: null, ok: false };

export function MemberForm() {
  const [state, formAction, pending] = useActionState(createMember, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);

  // Limpa os campos após criar com sucesso (o toast de sucesso fica visível).
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="admin-form-grid" noValidate>
      <div className="admin-field">
        <label htmlFor="m-name" className="admin-field__label">
          Nome
        </label>
        <input
          id="m-name"
          name="name"
          type="text"
          required
          autoComplete="name"
          className="admin-field__input"
          placeholder="Nome do membro"
        />
      </div>

      <div className="admin-field">
        <label htmlFor="m-email" className="admin-field__label">
          E-mail (login)
        </label>
        <input
          id="m-email"
          name="email"
          type="email"
          required
          autoComplete="off"
          className="admin-field__input"
          placeholder="membro@exemplo.com"
        />
      </div>

      <div className="admin-field">
        <label htmlFor="m-password" className="admin-field__label">
          Senha provisória
        </label>
        <input
          id="m-password"
          name="password"
          type="text"
          required
          minLength={8}
          autoComplete="new-password"
          className="admin-field__input"
          placeholder="mín. 8 caracteres"
        />
      </div>

      <div className="admin-field">
        <label htmlFor="m-role" className="admin-field__label">
          Papel
        </label>
        <select id="m-role" name="role" className="admin-field__input" defaultValue="editor">
          <option value="editor">Editor — gerencia conteúdo</option>
          <option value="owner">Titular — gerencia também a equipe</option>
        </select>
      </div>

      {state.error ? (
        <p role="alert" className="admin-login__error" style={{ gridColumn: "1 / -1" }}>
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p
          role="status"
          className="admin-note"
          style={{ gridColumn: "1 / -1", margin: 0 }}
        >
          <strong>Membro adicionado.</strong> Ele já pode entrar em{" "}
          <code>/admin/login</code> com o e-mail e a senha definidos.
        </p>
      ) : null}

      <div style={{ gridColumn: "1 / -1" }}>
        <button type="submit" className="admin-btn" disabled={pending}>
          {pending ? "Adicionando…" : "Adicionar membro"}
        </button>
      </div>
    </form>
  );
}
