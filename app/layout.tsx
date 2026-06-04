import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Wallet Fidélité',
  description: 'Cartes de fidélité digitales pour commerçants',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${inter.className} min-h-screen bg-[#080d1a] text-white`}>
        <nav className="border-b border-[#1e2d4a] px-6 py-3 flex items-center gap-6">
          <Link href="/" className="font-bold text-lg">
            🎴 <span className="text-[#3b7bff]">Wallet</span> Fidélité
          </Link>
          <Link href="/wallet" className="text-sm text-[#8b9fc4] hover:text-white transition-colors">Mon Wallet</Link>
          <Link href="/commercant" className="text-sm text-[#8b9fc4] hover:text-white transition-colors">Espace Commerçant</Link>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
