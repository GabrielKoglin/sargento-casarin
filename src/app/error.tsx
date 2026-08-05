"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Loga internamente; nenhum detalhe técnico é exposto ao usuário final.
    console.error(error);
  }, [error]);

  return (
    <section
      className="page-hero"
      style={{ minHeight: "75vh", display: "flex", alignItems: "center" }}
    >
      <div className="container">
        <div className="eyebrow">Falha na operação</div>
        <h1>
          ALGO SAIU
          <br />
          <em>DO PREVISTO</em>
        </h1>
        <p>
          Encontramos um imprevisto ao carregar esta página. Respire fundo:
          você pode tentar de novo ou voltar para a base.
        </p>
        <div
          style={{
            marginTop: "2rem",
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <button type="button" onClick={() => reset()} className="btn btn-gold">
            Tentar de novo ➔
          </button>
          <Link href="/" className="btn btn-ghost">
            Voltar à base
          </Link>
        </div>
      </div>
    </section>
  );
}
