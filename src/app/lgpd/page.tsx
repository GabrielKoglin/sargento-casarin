import type { Metadata } from "next";
import { getSiteContent, renderHeading, renderLegalBody } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "LGPD — Proteção de Dados",
  description:
    "Portal LGPD: seus direitos como titular de dados e como exercê-los, conforme a Lei nº 13.709/2018.",
};

export const dynamic = "force-dynamic";

export default async function LgpdPage() {
  const { legal } = await getSiteContent();
  const p = legal.lgpd;

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow sl">{p.eyebrow}</div>
          <h1 className="sl d1">{renderHeading(p.title)}</h1>
          {p.lead ? <p className="fi d2">{p.lead}</p> : null}
        </div>
      </section>

      <section className="section" style={{ paddingTop: "3.5rem" }}>
        <div className="container">
          <div className="priv-body">{renderLegalBody(p.body)}</div>
        </div>
      </section>
    </>
  );
}
