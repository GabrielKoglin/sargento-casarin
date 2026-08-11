import type { Metadata } from "next";
import { getSiteContent, renderHeading, renderLegalBody } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Política de Cookies",
  description:
    "Como o site utiliza cookies, para quê servem e como você pode gerenciá-los, conforme a LGPD.",
};

export const dynamic = "force-dynamic";

export default async function CookiesPage() {
  const { legal } = await getSiteContent();
  const p = legal.cookies;

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
