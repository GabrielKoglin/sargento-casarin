import type { Metadata } from "next";
import Link from "next/link";
import { getSiteContent, renderHeading } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Nossas Mídias",
  description: "Canais oficiais do Sargento Dickson Casarin nas redes sociais.",
};

export const dynamic = "force-dynamic";

export default async function MidiasPage() {
  const { midias } = await getSiteContent();

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow sl">{midias.heroEyebrow}</div>
          <h1 className="sl d1">{renderHeading(midias.heroTitle)}</h1>
          <p className="fi d2">{midias.heroLead}</p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: "3.5rem" }}>
        <div className="container">
          <div className="contact-grid">
            {midias.canais.map((canal, i) => (
              <a
                key={i}
                href={canal.href}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-card fi"
              >
                <div className="contact-icon" aria-hidden="true">{canal.icon}</div>
                <h2>{canal.name}</h2>
                <p>{canal.handle}</p>
              </a>
            ))}
          </div>

          <div className="mt-bloco" style={{ marginTop: "3rem" }}>
            <h2>{midias.ctaTitle}</h2>
            <p>{midias.ctaText}</p>
            <Link href="/tropa" className="btn btn-gold">
              Nossos Grupos <span aria-hidden="true">➔</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
