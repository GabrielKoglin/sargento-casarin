import Link from "next/link";
import { SiFacebook, SiInstagram, SiThreads, SiTiktok, SiX, SiYoutube } from "react-icons/si";

const navFooter = [
  { name: "Início", href: "/" },
  { name: "Quem é o Casarin", href: "/sobre" },
  { name: "Propostas", href: "/propostas" },
  { name: "Manifesto", href: "/manifesto" },
  { name: "Notícias", href: "/noticias" },
  { name: "Agenda", href: "/agenda" },
];

const participeFooter = [
  { name: "Nossos Grupos", href: "https://wpgrupos.spx.ia.br/entrar" },
  { name: "Seja um Apoiador", href: "/tropa" },
  { name: "Quero Ajudar", href: "/ajudar" },
  { name: "Nossas Mídias", href: "/midias" },
  { name: "Quero Apoiar", href: "/contato" },
];

// Links legais/compliance — agrupados na barra inferior do rodapé.
const legalFooter = [
  { name: "Privacidade", href: "/privacidade" },
  { name: "Termos de Uso", href: "/termos" },
  { name: "Cookies", href: "/cookies" },
  { name: "LGPD", href: "/lgpd" },
  { name: "Regras e Normas", href: "/regras" },
];

// Perfis oficiais. TODO: X (Twitter) e YouTube ainda são placeholder — trocar
// quando o cliente enviar os links.
const socialLinks = [
  { name: "Instagram", icon: SiInstagram, href: "https://www.instagram.com/sargentocasarin" },
  { name: "Facebook", icon: SiFacebook, href: "https://www.facebook.com/sargentocasarin" },
  { name: "Threads", icon: SiThreads, href: "https://www.threads.com/@sargentocasarin" },
  { name: "TikTok", icon: SiTiktok, href: "https://www.tiktok.com/@sargentocasarin" },
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
                Sargento <em>CASARIN</em>
              </span>
            </Link>
            <p style={{ marginTop: "1.25rem" }}>
              Sargento Dickson Casarin, candidato a Deputado Estadual por Mato Grosso.
              Eleições 2026.
            </p>
            <a className="foot-email" href="mailto:atendimento@sargentocasarinmt.com.br">
              atendimento@sargentocasarinmt.com.br
            </a>
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
                  {link.href.startsWith("http") ? (
                    <a href={link.href} target="_blank" rel="noopener noreferrer">{link.name}</a>
                  ) : (
                    <Link href={link.href}>{link.name}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <div className="foot-bottom__left">
            <p>
              © {currentYear} Sargento Dickson Casarin · Material de campanha · Todos os
              direitos reservados
            </p>
            <p className="foot-credit">
              Desenvolvido por{" "}
              <span className="foot-dev">Gabriel Koglin</span>
            </p>
          </div>
          <nav className="foot-legal" aria-label="Links legais">
            {legalFooter.map((link) => (
              <Link key={link.href} href={link.href}>{link.name}</Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
