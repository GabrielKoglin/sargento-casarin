"use client";

// Ações por membro (visíveis só para o titular): trocar papel, redefinir senha
// e excluir. Client component para: (a) confirmar a exclusão, (b) revelar o
// campo de nova senha sob demanda, (c) auto-submeter a troca de papel. As três
// chamam Server Actions (FormData) definidas em ./actions.
import { useRef, useState } from "react";
import { deleteMember, resetMemberPassword, setMemberRole } from "./actions";
import { ConfirmSubmit } from "../confirm-submit";

export function MemberActions({
  id,
  role,
  isSelf,
  canDelete,
}: {
  id: string;
  role: string;
  isSelf: boolean;
  canDelete: boolean;
}) {
  const [resetting, setResetting] = useState(false);
  const roleFormRef = useRef<HTMLFormElement>(null);

  return (
    <div className="admin-member__actions">
      {/* Papel — auto-submete ao mudar. NÃO aparece na PRÓPRIA conta: você não
          pode se rebaixar (trava anti-lockout) e o papel já está no selo acima —
          um dropdown travado só confundiria. Aparece/funciona para os demais. */}
      {!isSelf ? (
        <form ref={roleFormRef} action={setMemberRole} className="admin-member__role">
          <input type="hidden" name="id" value={id} />
          <label className="admin-field__label" htmlFor={`role-${id}`}>
            Papel
          </label>
          <select
            id={`role-${id}`}
            name="role"
            defaultValue={role}
            className="admin-field__input admin-field__input--sm"
            onChange={() => roleFormRef.current?.requestSubmit()}
          >
            <option value="editor">Editor</option>
            <option value="owner">Titular</option>
          </select>
        </form>
      ) : null}

      <div className="admin-member__buttons">
        <button
          type="button"
          className="admin-linkbtn"
          onClick={() => setResetting((v) => !v)}
        >
          {resetting ? "Cancelar" : "Redefinir senha"}
        </button>

        {canDelete ? (
          <form action={deleteMember}>
            <input type="hidden" name="id" value={id} />
            <ConfirmSubmit
              className="admin-linkbtn admin-linkbtn--danger"
              title="Excluir membro"
              message="Excluir este membro? Ele perderá o acesso ao painel."
              confirmLabel="Excluir"
              danger
            >
              Excluir
            </ConfirmSubmit>
          </form>
        ) : null}
      </div>

      {resetting ? (
        <form
          action={resetMemberPassword}
          className="admin-member__reset"
          onSubmit={() => setResetting(false)}
        >
          <input type="hidden" name="id" value={id} />
          <input
            name="password"
            type="text"
            required
            minLength={8}
            placeholder="Nova senha (mín. 8)"
            className="admin-field__input admin-field__input--sm"
            autoComplete="new-password"
          />
          <button type="submit" className="admin-btn admin-btn--sm">
            Salvar
          </button>
        </form>
      ) : null}
    </div>
  );
}
