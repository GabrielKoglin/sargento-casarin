import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { TacticalFx } from "@/components/tactical-fx";
import { CookieConsent } from "@/components/cookie-consent";
import { AiAssistant } from "@/components/ai-assistant";
import { VLibras } from "@/components/vlibras";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sargentocasarin.com.br"), // Placeholder
  title: {
    template: "%s | Sargento Dickson Casarin",
    default: "Sargento Dickson Casarin - Candidato",
  },
  description:
    "Site Institucional Oficial do Sargento Dickson Casarin, focado em segurança, desenvolvimento e compromisso com o Mato Grosso.",
  openGraph: {
    title: "Sargento Dickson Casarin",
    description:
      "Site Institucional Oficial do Sargento Dickson Casarin, focado em segurança, desenvolvimento e compromisso com o Mato Grosso.",
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
        <a href="#conteudo" className="skip-link">
          Pular para o conteúdo
        </a>
        <Header />
        <main id="conteudo" className="flex-1">
          {children}
        </main>
        <Footer />
        <AiAssistant />
        <VLibras />
        <TacticalFx />
        <CookieConsent />
      </body>
    </html>
  );
}
