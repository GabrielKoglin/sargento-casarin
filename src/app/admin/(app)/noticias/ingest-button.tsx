"use client";
import { useFormStatus } from "react-dom";
export function IngestButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="admin-btn" disabled={pending} title="Busca os feeds agora">
      {pending ? "Buscando notícias…" : "Buscar notícias agora"}
    </button>
  );
}
