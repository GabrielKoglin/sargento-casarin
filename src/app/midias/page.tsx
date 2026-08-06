import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Nossas Mídias",
  description: "Canais oficiais do Sargento Dickson Casarin nas redes sociais.",
};

// TODO: substituir pelos perfis oficiais quando definidos
const canais = [
  {
    icon: "📷",
    name: "Instagram",
    handle: "Perfil oficial em breve",
    href: "https://instagram.com",
  },
  {
    icon: "▶️",
    name: "YouTube",
    handle: "Canal oficial em breve",
    href: "https://youtube.com",
  },
  {
    icon: "📘",
    name: "Facebook",
    handle: "Página oficial em breve",
    href: "https://facebook.com",
  },
  {
    icon: "✖️",
    name: "X (Twitter)",
    handle: "Perfil oficial em breve",
    href: "https://twitter.com",
  },
];

export default function MidiasPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow sl">Comunicação</div>
          <h1 className="sl d1">
            NOSSOS <em>CANAIS</em>
          </h1>
          <p className="fi d2">
            Siga o Sargento Casarin nas redes e acompanhe a missão de perto. Os perfis
            oficiais serão listados nesta página.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: "3.5rem" }}>
        <div className="container">
          <div className="contact-grid">
            {canais.map((canal) => (
              <a
                key={canal.name}
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
            <h2>Não perca nenhuma novidade</h2>
            <p>Entre nos nossos grupos e receba os conteúdos direto no seu WhatsApp.</p>
            <Link href="/tropa" className="btn btn-gold">
              Nossos Grupos <span aria-hidden="true">➔</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
