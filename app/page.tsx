import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-6">🎴</div>
      <h1 className="text-4xl font-bold mb-4">Wallet Fidélité</h1>
      <p className="text-[#8b9fc4] text-lg mb-12 max-w-xl mx-auto">
        Fini les cartes papier — offrez à vos clients une carte fidélité digitale dans leur wallet.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Link href="/wallet" className="bg-[#0f1729] border border-[#1e2d4a] hover:border-[#3b7bff] rounded-2xl p-8 text-left transition-colors group">
          <div className="text-4xl mb-4">📱</div>
          <h2 className="text-xl font-bold mb-2">Espace Client</h2>
          <p className="text-[#8b9fc4] text-sm">Retrouvez toutes vos cartes fidélité et consultez vos points.</p>
          <div className="mt-4 text-[#3b7bff] text-sm font-medium group-hover:underline">Voir mon wallet →</div>
        </Link>
        <Link href="/commercant" className="bg-[#0f1729] border border-[#1e2d4a] hover:border-[#3b7bff] rounded-2xl p-8 text-left transition-colors group">
          <div className="text-4xl mb-4">🏪</div>
          <h2 className="text-xl font-bold mb-2">Espace Commerçant</h2>
          <p className="text-[#8b9fc4] text-sm">Créez votre programme fidélité et gérez vos clients.</p>
          <div className="mt-4 text-[#3b7bff] text-sm font-medium group-hover:underline">Gérer mon programme →</div>
        </Link>
      </div>
    </div>
  );
}
