"use client";

// Botão de exclusão de proposta com MODAL de confirmação (ConfirmSubmit).
// Fica dentro de um <form action={deleteProposal}>; ao confirmar no modal, o
// componente submete esse form. Substitui o antigo window.confirm().
import { ConfirmSubmit } from "../confirm-submit";

export function DeleteButton({ label }: { label: string }) {
  return (
    <ConfirmSubmit
      className="admin-btn admin-btn--danger admin-btn--sm"
      title="Excluir proposta"
      message={`Excluir a proposta "${label}"? Esta ação não pode ser desfeita.`}
      confirmLabel="Excluir"
      danger
    >
      Excluir
    </ConfirmSubmit>
  );
}
