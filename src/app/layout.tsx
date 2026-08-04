import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Sargento Dickson Casarin",
    default: "Sargento Dickson Casarin - Pré-Candidato",
  },
  description: "Site Institucional Oficial do Sargento Dickson Casarin, focado em segurança, desenvolvimento e compromisso com o Mato Grosso.",
  openGraph: {
    title: "Sargento Dickson Casarin",
    description: "Site Institucional Oficial do Sargento Dickson Casarin, focado em segurança, desenvolvimento e compromisso com o Mato Grosso.",
    url: "https://sargentocasarin.com.br", // Placeholder
    siteName: "Sargento Dickson Casarin",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${inter.variable} antialiased`}>
      <body className="min-h-screen flex flex-col font-sans">
        <nav className="navbar" id="navbar">
          <div className="container">
            <a href="/" className="nav-logo">
              <span style={{ fontWeight: 900, color: 'white', fontSize: '1.2rem', textTransform: 'uppercase' }}>
                Casarin
              </span>
            </a>
            <button className="nav-toggle" id="navToggle" aria-label="Menu"><span></span><span></span><span></span></button>
            <ul className="nav-links" id="navLinks">
              <li><a href="/" className="active">Início</a></li>
              <li><a href="/sobre">Quem é o Casarin</a></li>
              <li><a href="/propostas">Propostas</a></li>
              <li><a href="/manifesto">Manifesto</a></li>
              <li><a href="/galeria">Galeria</a></li>
              <li><a href="/tropa" className="btn-tropa-nav">Entre para a Tropa</a></li>
            </ul>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
