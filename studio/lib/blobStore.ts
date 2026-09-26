import { get, put } from "@vercel/blob";

// Un store Blob peut être privé ou public selon sa création : on essaie privé d'abord.
// En public, les chemins sont préfixés par un secret dérivé du jeton pour ne pas être devinables.

export const blobEnabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

async function secretPrefix(): Promise<string> {
  const data = new TextEncoder().encode(`studio-blob:${process.env.BLOB_READ_WRITE_TOKEN ?? ""}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest).slice(0, 12), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function putFile(pathname: string, body: Blob | string, contentType: string): Promise<{ access: "private" | "public"; url: string; pathname: string }> {
  const opts = { allowOverwrite: true, addRandomSuffix: false, contentType };
  try {
    const r = await put(pathname, body, { ...opts, access: "private" });
    return { access: "private", url: r.url, pathname: r.pathname };
  } catch {
    const r = await put(`${await secretPrefix()}/${pathname}`, body, { ...opts, access: "public" });
    return { access: "public", url: r.url, pathname: r.pathname };
  }
}

export async function getFile(pathname: string) {
  try {
    const r = await get(pathname, { access: "private", useCache: false });
    if (r) return r;
  } catch {
    // store public : on tente le chemin préfixé
  }
  try {
    return await get(`${await secretPrefix()}/${pathname}`, { access: "public", useCache: false });
  } catch {
    return null;
  }
}
