import type { Metadata } from "next";
import Link from "next/link";
import { getSiteContent, renderHeading, renderRich } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Quero Ajudar",
  description: "Formas de apoiar a campanha do Sargento Dickson Casarin em Mato Grosso.",
};

export const dynamic = "force-dynamic";

export default async function AjudarPage() {
  const { ajudar } = await getSiteContent();

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow sl">{ajudar.heroEyebrow}</div>
          <h1 className="sl d1">{renderHeading(ajudar.heroTitle)}</h1>
          <p className="fi d2">{ajudar.heroLead}</p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: "3.5rem" }}>
        <div className="container">
          <div className="legal-alert fi">
            <span className="legal-alert-icon" aria-hidden="true">⚖️</span>
            <p>{renderRich(ajudar.legalAlert)}</p>
          </div>

          <div className="contact-grid">
            {ajudar.cards.map((c, i) => (
              <div className={`contact-card fi${i > 0 ? ` d${i}` : ""}`} key={i}>
                <div className="contact-icon" aria-hidden="true">{c.icon}</div>
                <h2>{c.title}</h2>
                <p>{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="support">
        <div className="topo-bg"></div>
        <div className="container">
          <div className="support-inner">
            <div className="eyebrow fi">{ajudar.supportEyebrow}</div>
            <h2 className="support-title fi d1">{renderHeading(ajudar.supportTitle)}</h2>
            <p className="support-lead fi d2">{renderRich(ajudar.supportLead)}</p>
            <div className="support-amounts fi d2">
              <div className="amount-chip">R$ 30 <span>exemplo</span></div>
              <div className="amount-chip">R$ 50 <span>exemplo</span></div>
              <div className="amount-chip">R$ 100 <span>exemplo</span></div>
              <div className="amount-chip">R$ 200 <span>exemplo</span></div>
            </div>
            <a
              href="https://apoiar.me/sargentocasarin"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-donate fi d3"
            >
              Quero apoiar <span aria-hidden="true">➔</span>
            </a>
            <div className="support-trust fi d3">{renderRich(ajudar.supportTrust)}</div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="mt-bloco">
            <h2>{ajudar.comeceTitle}</h2>
            <p>{ajudar.comeceText}</p>
            <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
              <Link href="/tropa" className="btn btn-gold">
                Nossos Grupos <span aria-hidden="true">➔</span>
              </Link>
              <Link href="/contato" className="btn btn-ghost">
                Falar com a equipe
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
