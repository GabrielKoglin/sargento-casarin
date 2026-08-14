import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Proposal } from "@/generated/prisma/client";
import { ProposalsList } from "./proposals-list";
import { getSiteContent, renderHeading } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Propostas",
  description:
    "Os eixos de atuação do Sargento Dickson Casarin para Mato Grosso: segurança, valorização dos profissionais, educação e desenvolvimento.",
};

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
  const [propostas, content] = await Promise.all([
    loadPropostas(),
    getSiteContent(),
  ]);
  const hero = content.propostasPage;

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow sl">{hero.heroEyebrow}</div>
          <h1 className="sl d1">{renderHeading(hero.heroTitle)}</h1>
          <p className="fi d2">{hero.heroLead}</p>
        </div>
      </section>

      <section className="bio-section section">
        <div className="container">
          {propostas.length === 0 ? (
            <p style={{ color: "rgba(28,40,24,.65)" }}>
              As propostas detalhadas serão publicadas em breve.
            </p>
          ) : (
            <>
              {hero.listTitle && (
                <h2 className="propostas-list-title fi">{hero.listTitle}</h2>
              )}
              <ProposalsList proposals={propostas} />
            </>
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
