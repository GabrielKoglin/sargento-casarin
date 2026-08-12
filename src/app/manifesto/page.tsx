import type { Metadata } from "next";
import Link from "next/link";
import { getSiteContent, renderRich } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Manifesto",
  description:
    "O manifesto do Sargento Dickson Casarin: por que a linha de frente precisa chegar à Assembleia Legislativa de Mato Grosso.",
};

export const dynamic = "force-dynamic";

export default async function ManifestoPage() {
  const { manifesto } = await getSiteContent();

  return (
    <section className="manifesto-hero">
      <div
        className="manifesto-bg"
        style={{ backgroundImage: "url(/casarin-why.jpeg)" }}
      ></div>
      <div className="container">
        <div className="manifesto-content">
          <div className="eyebrow sl">{manifesto.eyebrow}</div>
          <h1 className="sl d1">
            {manifesto.titleLine1}
            <br />
            <em>{manifesto.titleEm}</em>
            <br />
            {manifesto.titleLine2}
          </h1>
          <div className="manifesto-hr"></div>
          <div className="manifesto-p">
            {manifesto.paragraphs.map((p, i) => (
              <p key={i} className={`fi${i > 0 ? ` d${Math.min(i, 3)}` : ""}`}>
                {renderRich(p)}
              </p>
            ))}
          </div>

          <div className="fi d3" style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
            <Link href="/tropa" className="btn btn-gold">
              Nossos Grupos ➔
            </Link>
            <Link href="/propostas" className="btn btn-ghost">
              Ver as propostas
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
