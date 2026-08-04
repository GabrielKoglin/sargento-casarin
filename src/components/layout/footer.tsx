import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";
import { SiFacebook, SiInstagram, SiX, SiYoutube } from "react-icons/si";

const mainLinks = [
  { name: "Início", href: "/" },
  { name: "Quem é Casarin", href: "/sobre" },
  { name: "Propostas", href: "/propostas" },
  { name: "Manifesto", href: "/manifesto" },
  { name: "Notícias", href: "/noticias" },
  { name: "Agenda", href: "/agenda" },
  { name: "Contato", href: "/contato" },
];

const legalLinks = [
  { name: "Política de Privacidade", href: "/privacidade" },
  { name: "Termos de Uso", href: "/termos" },
  { name: "Política de Cookies", href: "/cookies" },
  { name: "Mapa do Site", href: "/sitemap" },
];

const socialLinks = [
  { name: "Instagram", icon: SiInstagram, href: "https://instagram.com" },
  { name: "Facebook", icon: SiFacebook, href: "https://facebook.com" },
  { name: "X (Twitter)", icon: SiX, href: "https://twitter.com" },
  { name: "YouTube", icon: SiYoutube, href: "https://youtube.com" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 dark:bg-background border-t border-slate-800 dark:border-border pt-16 pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <span className="font-bold text-3xl tracking-tighter text-white">CASARIN</span>
            </Link>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed max-w-xs">
              Sargento Dickson Casarin. Segurança, compromisso e patriotismo por um Mato Grosso mais forte e desenvolvido.
            </p>
            <div className="flex space-x-4 pt-2">
              {socialLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-accent transition-colors"
                  aria-label={item.name}
                >
                  <item.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Navegação</h3>
            <ul className="space-y-3">
              {mainLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Contato</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-3 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">Cuiabá, Mato Grosso - Brasil</span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-3 text-primary shrink-0" />
                <span className="text-sm">(65) 99999-9999</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-3 text-primary shrink-0" />
                <span className="text-sm">contato@sargentocasarin.com.br</span>
              </li>
            </ul>
          </div>

          {/* LGPD & Legal */}
          <div>
            <h3 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Legal & LGPD</h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 dark:border-border pt-8 mt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500 text-center md:text-left">
            &copy; {currentYear} Sargento Dickson Casarin. Todos os direitos reservados. 
            CNPJ: 00.000.000/0000-00 (Placeholder)
          </p>
          <div className="text-xs text-slate-500">
            Desenvolvido com <span className="text-primary">segurança</span> e <span className="text-secondary">performance</span>.
          </div>
        </div>
      </div>
    </footer>
  );
}
