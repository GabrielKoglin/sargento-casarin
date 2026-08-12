import type { Metadata } from "next";
import { StickerForm } from "@/components/sticker-form";

export const metadata: Metadata = {
  title: "Retire seu adesivo",
  description:
    "Peça o adesivo da campanha do Sargento Dickson Casarin. Entregamos se estivermos na sua cidade; caso contrário, a retirada é com o apoiador responsável da sua cidade.",
};

export default function AdesivosPage() {
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
            Cole o Sargento Casarin no seu carro, na sua moto ou na sua janela e
            ajude a espalhar a mensagem por Mato Grosso. É de graça.
          </p>
        </div>
      </section>

      <div className="form-wrap">
        <div className="container">
          <div className="form-box">
            <h2>Peça seu adesivo</h2>
            <p>
              Preencha os dados abaixo que a gente organiza a entrega. Veja como funciona:
            </p>

            <ul className="adesivo-how" aria-label="Como funciona">
              <li>
                <span className="adesivo-how__ico" aria-hidden="true">🚚</span>
                <div>
                  <strong>Estamos na sua cidade?</strong>
                  <span>A gente entrega o adesivo no seu endereço.</span>
                </div>
              </li>
              <li>
                <span className="adesivo-how__ico" aria-hidden="true">🤝</span>
                <div>
                  <strong>Não estamos por aí?</strong>
                  <span>
                    O apoiador responsável da sua cidade fala com você pelo WhatsApp
                    para combinar a retirada.
                  </span>
                </div>
              </li>
            </ul>

            <StickerForm />
          </div>
        </div>
      </div>
    </>
  );
}
