import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const permissionMap: Record<string, string | null> = {
  "/admin/commandes": "manage_commandes",
  "/admin/menus": "manage_menus",
  "/admin/rh": "create_employee",
  "/admin/finances": "manage_finances",
  "/admin/messages": "manage_messages",
  "/admin/parametres": null,
};

function validateRequestOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  if (!origin && !referer) return true;
  const expectedOrigin = new URL(request.url).origin;
  if (origin && origin !== expectedOrigin) return false;
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.origin !== expectedOrigin) return false;
    } catch { return false; }
  }
  return true;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
    if (!pathname.startsWith("/api/auth") && !validateRequestOrigin(request)) {
      return NextResponse.json({ error: "Requête non autorisée" }, { status: 403 });
    }
  }

  if (pathname === "/pointage" || pathname === "/login" || pathname === "/") {
    return NextResponse.next();
  }

if (pathname === "/pointage" || pathname === "/login" || pathname === "/" || pathname === "/api/debug") {  if (
    pathname === "/api/admin/init-db" ||
    pathname === "/api/admin/debug-env" ||
    pathname === "/api/admin/migrate-db"
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      if (pathname.startsWith("/api")) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (pathname.startsWith("/admin") && pathname !== "/admin") {
      const userPermissions = (token.permissions as string[]) || [];
      const requiredPermission = Object.entries(permissionMap).find(
        ([route]) => pathname.startsWith(route)
      )?.[1];
      if (requiredPermission && !userPermissions.includes(requiredPermission)) {
        if (pathname.startsWith("/api")) {
          return NextResponse.json({ error: "Permission insuffisante" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/admin/non-autorise", request.url));
      }
    }
    const response = NextResponse.next();
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    return response;
  }

  if (pathname.startsWith("/api")) {
    const publicApiRoutes = ["/api/csrf-token", "/api/auth", "/api/public"];
    const isPublic = publicApiRoutes.some((route) => pathname.startsWith(route));
    if (!isPublic) {
      const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
      if (!token) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*", "/pointage", "/login", "/"],
};
