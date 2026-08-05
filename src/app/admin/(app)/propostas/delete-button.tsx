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
      className="inline-flex cursor-pointer items-center rounded-[3px] border border-[rgba(255,90,90,0.35)] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[var(--a-danger)] transition-colors hover:bg-[rgba(255,90,90,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(255,90,90,0.5)]"
    >
      Excluir
    </button>
  );
}
