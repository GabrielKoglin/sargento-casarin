import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { MtMap, type LeaderPin } from "@/components/mt-map";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Retire seu adesivo",
  description:
    "Encontre no mapa de Mato Grosso o líder apoiador do Sargento Dickson Casarin na sua cidade e retire o seu adesivo. Não tem líder por aí? Cadastre-se para ser um.",
};

// Uma falha de I/O não pode derrubar a página: cai numa lista vazia (o mapa
// ainda funciona, só sem cidades marcadas) em vez de estourar 500.
async function loadLeaders(): Promise<LeaderPin[]> {
  try {
    return await prisma.leader.findMany({
      where: { status: "active" },
      select: { id: true, name: true, whatsapp: true, city: true, cityCode: true },
      orderBy: { city: "asc" },
    });
  } catch (error) {
    console.error("Falha ao carregar líderes apoiadores.", error);
    return [];
  }
}

export default async function AdesivosPage() {
  const leaders = await loadLeaders();

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow sl">Adesivos</div>
          <h1 className="sl d1">
            RETIRE SEU <br />
            <em>ADESIVO</em>
          </h1>
          <p className="fi d2">
            Ache a sua cidade no mapa de Mato Grosso e fale com o líder apoiador para
            pegar o seu adesivo. É de graça — cole o Casarin no carro, na moto ou na
            janela e ajude a espalhar a mensagem.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <ul className="adesivo-how" aria-label="Como funciona">
            <li>
              <span className="adesivo-how__ico" aria-hidden="true">📍</span>
              <div>
                <strong>Tem líder na sua cidade?</strong>
                <span>Você fala direto com ele no WhatsApp e combina a retirada.</span>
              </div>
            </li>
            <li>
              <span className="adesivo-how__ico" aria-hidden="true">🤝</span>
              <div>
                <strong>Ainda não tem?</strong>
                <span>Cadastre-se para ser o líder apoiador e levar os adesivos para aí.</span>
              </div>
            </li>
          </ul>

          <MtMap leaders={leaders} />
        </div>
      </section>
    </>
  );
}
