'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/prospects', label: 'Prospects' },
  { href: '/generator', label: 'Générateur' },
  { href: '/dashboard', label: 'Tableau de bord' },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-8">
      <span className="font-bold text-blue-600 text-lg tracking-tight">HelpMe</span>
      <div className="flex gap-1">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname.startsWith(href)
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
