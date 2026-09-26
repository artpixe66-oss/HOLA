export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next = "/", error } = await searchParams;
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <form method="post" action="/api/login" className="w-full max-w-sm space-y-4 rounded-[28px] bg-white p-6 text-black">
        <p className="text-2xl font-semibold">Connexion</p>
        <input type="hidden" name="next" value={next} />
        <input name="password" type="password" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoFocus required placeholder="Mot de passe" className="w-full rounded-2xl border border-black/10 bg-black/5 px-4 py-3 outline-none focus:border-black" />
        {error && <p className="text-sm text-red-600">Mot de passe incorrect.</p>}
        <button className="w-full rounded-full bg-black py-3 font-semibold text-white">Entrer</button>
      </form>
    </div>
  );
}
