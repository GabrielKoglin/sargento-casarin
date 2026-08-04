"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const navLinks = [
  { name: "Início", href: "/" },
  { name: "Quem é o Casarin", href: "/sobre" },
  { name: "Propostas", href: "/propostas" },
  { name: "Manifesto", href: "/manifesto" },
  { name: "Galeria", href: "/galeria" },
  { name: "Notícias", href: "/noticias" },
  { name: "Contato", href: "/contato" },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const headerClasses = `fixed top-0 w-full z-50 transition-all duration-300 ${
    isScrolled || mobileMenuOpen
      ? "bg-[#04111f]/95 backdrop-blur-sm shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
      : "bg-transparent"
  }`;

  return (
    <header className={headerClasses}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 md:h-24">
          
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex flex-col">
              <span className="font-black text-2xl md:text-3xl tracking-wider text-white uppercase leading-none">
                CASARIN
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2 lg:space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`relative px-2 py-2 text-[13px] font-bold uppercase tracking-[0.1em] transition-colors hover:text-white ${
                  pathname === link.href ? "text-white" : "text-white/70"
                }`}
              >
                {link.name}
                {pathname === link.href && (
                  <span className="absolute -bottom-1 left-2 right-2 h-[2px] bg-[#00b84b]"></span>
                )}
              </Link>
            ))}
            
            {/* Action Button - Mídias */}
            <Link 
              href="/midias"
              className="ml-4 px-6 py-2.5 bg-[#00b84b] text-black hover:bg-[#00d658] text-[13px] font-black uppercase tracking-wider transition-all"
            >
              NOSSOS CANAIS DE MÍDIAS
            </Link>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              className="p-2 text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#04111f] border-t border-gray-800">
          <div className="px-4 py-6 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="block text-sm font-bold uppercase tracking-wider text-gray-300 hover:text-white"
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-6">
              <Link 
                href="/midias"
                className="w-full flex items-center justify-center px-6 py-4 bg-[#00b84b] text-black text-lg font-black uppercase tracking-wider hover:bg-[#00d658]"
              >
                NOSSOS CANAIS DE MÍDIAS
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
