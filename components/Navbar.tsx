'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/prospects', label: 'Prospects' },
  { href: '/recherche', label: 'Recherche' },
  { href: '/generator', label: 'Générateur' },
  { href: '/dashboard', label: 'Tableau de bord' },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="bg-brand-bg border-b border-brand-border px-6 py-3 flex items-center gap-8">
      <span className="font-bold text-lg tracking-tight select-none">
        <span className="text-white">help</span>
        <span className="text-brand-blue">(me)</span>
      </span>
      <div className="flex gap-1">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname.startsWith(href)
                ? 'text-brand-blue border-b-2 border-brand-blue pb-1.5'
                : 'text-brand-muted hover:text-white hover:bg-brand-surface'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
