import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Propostas",
  description:
    "Os eixos de atuação do Sargento Dickson Casarin para Mato Grosso: segurança, valorização dos profissionais, educação e desenvolvimento.",
};

const icons: Record<string, string> = {
  "seguranca-publica": "🛡️",
  "valorizacao-dos-profissionais": "🎖️",
  "educacao-e-valores": "📚",
  "mato-grosso-forte": "🌾",
};

function iconFor(slug: string, category: string) {
  if (icons[slug]) return icons[slug];
  if (category === "Segurança") return "🛡️";
  if (category === "Educação") return "📚";
  return "📌";
}

export default async function PropostasPage() {
  const propostas = await prisma.proposal.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow sl">Eixos de atuação</div>
          <h1 className="sl d1">
            PLANOS DE <em>AÇÃO</em>
          </h1>
          <p className="fi d2">
            O que o Sargento Casarin vai defender na Assembleia Legislativa de Mato Grosso.
          </p>
        </div>
      </section>

      <section className="bio-section section">
        <div className="container">
          {propostas.length === 0 ? (
            <p style={{ color: "rgba(28,40,24,.65)" }}>
              As propostas detalhadas serão publicadas em breve.
            </p>
          ) : (
            propostas.map((p) => (
              <Link href={`/propostas/${p.slug}`} className="eixo-card fi" key={p.id}>
                <div className="eixo-icon">{iconFor(p.slug, p.category)}</div>
                <div>
                  <h3>{p.title}</h3>
                  <p>{p.description}</p>
                </div>
              </Link>
            ))
          )}

          <div className="mt-bloco">
            <h2>Tem uma sugestão?</h2>
            <p>
              As propostas nascem da escuta de quem vive Mato Grosso todos os dias. Mande a
              sua ideia — cada mensagem é lida pela equipe.
            </p>
            <Link href="/contato" className="btn btn-gold">
              Enviar sugestão ➔
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
