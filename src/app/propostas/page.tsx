import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Proposal } from "@/generated/prisma/client";

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

// Uma falha de I/O não pode derrubar a página: cai numa lista vazia, que
// mostra o empty-state "em breve" em vez de estourar 500.
async function loadPropostas(): Promise<Proposal[]> {
  try {
    return await prisma.proposal.findMany({
      orderBy: { createdAt: "asc" },
    });
  } catch (error) {
    console.error("Falha ao carregar propostas.", error);
    return [];
  }
}

export default async function PropostasPage() {
  const propostas = await loadPropostas();

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
                <div className="eixo-icon" aria-hidden="true">{iconFor(p.slug, p.category)}</div>
                <div>
                  <h2>{p.title}</h2>
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
              Enviar sugestão <span aria-hidden="true">➔</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
