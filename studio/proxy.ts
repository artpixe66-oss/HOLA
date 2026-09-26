import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, authToken, normalizePassword } from "@/lib/auth";

// Sans APP_PASSWORD (en local), l'application reste ouverte.
export async function proxy(request: NextRequest) {
  const password = normalizePassword(process.env.APP_PASSWORD);
  if (!password) return NextResponse.next();
  const cookie = request.cookies.get(AUTH_COOKIE)?.value;
  if (cookie && cookie === (await authToken(password))) return NextResponse.next();
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }
  const url = new URL("/login", request.url);
  url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!login|api/login|_next/static|_next/image|favicon.ico).*)"],
};
