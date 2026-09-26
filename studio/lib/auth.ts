export const AUTH_COOKIE = "studio_auth";

/** Jeton de session dérivé du mot de passe : changer APP_PASSWORD déconnecte tout le monde. */
export async function authToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`studio:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Tolère espaces, guillemets ou accents graves copiés avec le mot de passe, et les majuscules. */
export function normalizePassword(value: string | undefined | null): string {
  return (value ?? "").trim().replace(/^["'`*]+|["'`*]+$/g, "").trim().toLowerCase();
}
