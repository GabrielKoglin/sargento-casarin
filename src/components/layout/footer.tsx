import Link from "next/link";
import { SiFacebook, SiInstagram, SiX, SiYoutube } from "react-icons/si";

const navFooter = [
  { name: "Início", href: "/" },
  { name: "Quem é o Casarin", href: "/sobre" },
  { name: "Propostas", href: "/propostas" },
  { name: "Manifesto", href: "/manifesto" },
  { name: "Notícias", href: "/noticias" },
  { name: "Agenda", href: "/agenda" },
  { name: "Galeria", href: "/galeria" },
];

const participeFooter = [
  { name: "Entre para a Tropa", href: "/tropa" },
  { name: "Quero Ajudar", href: "/ajudar" },
  { name: "Nossas Mídias", href: "/midias" },
  { name: "Contato", href: "/contato" },
  { name: "Política de Privacidade", href: "/privacidade" },
  { name: "Termos de Uso", href: "/termos" },
];

// TODO: substituir pelos perfis oficiais quando definidos
const socialLinks = [
  { name: "Instagram", icon: SiInstagram, href: "https://instagram.com" },
  { name: "Facebook", icon: SiFacebook, href: "https://facebook.com" },
  { name: "X (Twitter)", icon: SiX, href: "https://twitter.com" },
  { name: "YouTube", icon: SiYoutube, href: "https://youtube.com" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer>
      <div className="container">
        <div className="foot-grid">
          <div className="foot-logo">
            <Link href="/" aria-label="Página inicial">
              <span className="nav-wordmark">
                Sgt <em>Casarin</em>
              </span>
            </Link>
            <p style={{ marginTop: "1.25rem" }}>
              Sargento Dickson Casarin, pré-candidato a Deputado Estadual por Mato Grosso.
              Eleições 2026.
            </p>
            <div className="foot-social">
              {socialLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="soc-btn"
                  aria-label={item.name}
                >
                  <item.icon size={14} />
                </a>
              ))}
            </div>
          </div>
          <div className="foot-col">
            <h2>Navegação</h2>
            <ul>
              {navFooter.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="foot-col">
            <h2>Participe</h2>
            <ul>
              {participeFooter.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <p>
            © {currentYear} Sargento Dickson Casarin · Material de pré-campanha · Todos os
            direitos reservados
          </p>
          <div className="foot-legal">
            <Link href="/privacidade">Privacidade</Link>
            <Link href="/contato">Contato</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
