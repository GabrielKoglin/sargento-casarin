"use client";

// Botão de exclusão com confirmação. Client Component pequeno para poder usar
// window.confirm() — a página de lista (Server Component) não pode ter onClick.
// Fica dentro de um <form action={deleteProposal}>; se o usuário cancelar,
// prevenimos o submit.

export function DeleteButton({ label }: { label: string }) {
  return (
    <button
      type="submit"
      onClick={(event) => {
        const ok = window.confirm(
          `Excluir a proposta "${label}"? Esta ação não pode ser desfeita.`,
        );
        if (!ok) event.preventDefault();
      }}
      className="admin-btn admin-btn--danger admin-btn--sm"
    >
      Excluir
    </button>
  );
}
