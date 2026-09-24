import { AUTH_COOKIE, authToken } from "@/lib/auth";

export async function POST(request: Request) {
  const form = await request.formData();
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/");
  const expected = process.env.APP_PASSWORD;
  const target = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  if (!expected || password !== expected) {
    return Response.redirect(new URL(`/login?error=1&next=${encodeURIComponent(target)}`, request.url), 303);
  }
  const headers = new Headers({ Location: new URL(target, request.url).toString() });
  headers.append("Set-Cookie", `${AUTH_COOKIE}=${await authToken(expected)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 90}`);
  return new Response(null, { status: 303, headers });
}
