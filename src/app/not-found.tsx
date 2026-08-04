import Link from "next/link";

export default function NotFound() {
  return (
    <section className="page-hero" style={{ minHeight: "75vh", display: "flex", alignItems: "center" }}>
      <div className="container">
        <div className="eyebrow">Erro 404</div>
        <h1>
          ALVO NÃO
          <br />
          <em>LOCALIZADO</em>
        </h1>
        <p>A página que você procura não existe ou mudou de endereço.</p>
        <div style={{ marginTop: "2rem" }}>
          <Link href="/" className="btn btn-gold">
            Voltar à base ➔
          </Link>
        </div>
      </div>
    </section>
  );
}
