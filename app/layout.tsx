import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "help(me) — CRM Prospection",
  description: "Outil de prospection pour les packs visibilité HelpMe",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-brand-bg text-white antialiased" style={{ fontFamily: 'var(--font-inter), Inter, sans-serif' }}>
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
