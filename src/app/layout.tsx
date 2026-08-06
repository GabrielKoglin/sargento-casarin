import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { TacticalFx } from "@/components/tactical-fx";
import { CookieConsent } from "@/components/cookie-consent";

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
        <Link href="/tropa" className="wa-float" aria-label="Nossos Grupos">
          <span className="wa-tip">Nossos Grupos ➔</span>
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="M16.001 3.2C8.94 3.2 3.2 8.94 3.2 16c0 2.26.6 4.46 1.73 6.4L3.2 28.8l6.59-1.71A12.74 12.74 0 0 0 16 28.68h.01c7.06 0 12.8-5.74 12.8-12.8 0-3.42-1.33-6.63-3.75-9.05A12.71 12.71 0 0 0 16.001 3.2zm0 23.3h-.01a10.6 10.6 0 0 1-5.4-1.48l-.39-.23-4.01 1.05 1.07-3.91-.25-.4a10.56 10.56 0 0 1-1.62-5.63c0-5.87 4.78-10.65 10.66-10.65 2.85 0 5.52 1.11 7.54 3.12a10.58 10.58 0 0 1 3.12 7.54c0 5.87-4.78 10.65-10.65 10.65zm5.85-7.98c-.32-.16-1.9-.94-2.19-1.04-.29-.11-.5-.16-.72.16-.21.32-.82 1.04-1.01 1.25-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.89-1.78-2.21-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.74-.99-2.38-.26-.62-.52-.54-.72-.55l-.61-.01c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.66 0 1.57 1.14 3.08 1.3 3.29.16.21 2.25 3.43 5.45 4.81.76.33 1.35.52 1.81.67.76.24 1.45.21 2 .13.61-.09 1.9-.78 2.17-1.53.27-.75.27-1.39.19-1.53-.08-.13-.29-.21-.61-.37z" />
          </svg>
        </Link>
        <TacticalFx />
        <CookieConsent />
      </body>
    </html>
  );
}
