import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = ["/login", "/esqueci-senha", "/403"];

/**
 * O middleware roda no Edge Runtime, que não suporta Node.js APIs como
 * bcrypt/Prisma (usados no provider de credenciais). Por isso, aqui a sessão
 * é lida diretamente do JWT via `getToken` (compatível com Edge), em vez de
 * importar a configuração completa do NextAuth (`@/lib/auth`).
 */
export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    if (isPublic) return NextResponse.next();
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = token.role as string | undefined;

  if (isPublic) {
    return NextResponse.redirect(new URL(role === "LOCATARIO" ? "/portal" : "/dashboard", req.url));
  }

  const isPortalRoute = pathname.startsWith("/portal");
  const isTenant = role === "LOCATARIO";

  if (isTenant && !isPortalRoute) {
    return NextResponse.redirect(new URL("/portal", req.url));
  }
  if (!isTenant && isPortalRoute) {
    return NextResponse.redirect(new URL("/403", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|uploads).*)"],
};
