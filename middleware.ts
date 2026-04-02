import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const permissionMap: Record<string, string> = {
  "/admin/commandes": "voir_commandes",
  "/admin/menus": "gerer_menus",
  "/admin/rh": "gerer_personnel",
  "/admin/finances": "voir_rapports",
  "/admin/messages": "gerer_messages",
  "/admin/parametres": "admin_uniquement",
};

/**
 * Validate request origin to prevent phishing attacks
 */
function validateRequestOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // Allow requests without origin (GET requests, etc.)
  if (!origin && !referer) {
    return true;
  }

  // Get the expected origin from request URL
  const expectedOrigin = new URL(request.url).origin;

  if (origin && origin !== expectedOrigin) {
    return false;
  }

  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.origin !== expectedOrigin) {
        return false;
      }
    } catch {
      return false;
    }
  }

  return true;
}

/**
 * Log security events
 */
function logSecurityEvent(
  request: NextRequest,
  eventType: string,
  details: any = {}
): void {
  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent") || "unknown";

  logger.warn("security", `[MIDDLEWARE] ${eventType}`, {
    ip,
    userAgent,
    pathname: request.nextUrl.pathname,
    ...details,
  });
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const ip = getClientIp(request);

  // Security check: validate origin for POST/PUT/DELETE requests
  if (["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
    if (!validateRequestOrigin(request)) {
      logSecurityEvent(request, "INVALID_ORIGIN", {
        method: request.method,
      });
      return NextResponse.json(
        { error: "Requête non autorisée" },
        { status: 403 }
      );
    }
  }

  // Allow public routes
  if (pathname === "/pointage" || pathname === "/login" || pathname === "/") {
    return NextResponse.next();
  }

  // Check if route requires authentication
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Not authenticated
    if (!token) {
      if (pathname.startsWith("/api")) {
        logSecurityEvent(request, "UNAUTHORIZED_API_ACCESS");
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      }

      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Check permissions for specific routes (skip dashboard)
    if (pathname.startsWith("/admin") && pathname !== "/admin") {
      const requiredPermission = Object.entries(permissionMap).find(
        ([route]) => pathname.startsWith(route)
      )?.[1];

      if (requiredPermission) {
        const userPermissions = (token.permissions as string[]) || [];

        if (
          requiredPermission !== "admin_uniquement" &&
          !userPermissions.includes(requiredPermission)
        ) {
          logSecurityEvent(request, "INSUFFICIENT_PERMISSIONS", {
            required: requiredPermission,
            has: userPermissions,
          });

          if (pathname.startsWith("/api")) {
            return NextResponse.json(
              { error: "Permission insuffisante" },
              { status: 403 }
            );
          }

          return NextResponse.redirect(
            new URL("/admin/non-autorise", request.url)
          );
        }

        if (
          requiredPermission === "admin_uniquement" &&
          token.role !== "Admin"
        ) {
          logSecurityEvent(request, "ADMIN_ONLY_ROUTE_ACCESSED", {
            userRole: token.role,
          });

          if (pathname.startsWith("/api")) {
            return NextResponse.json(
              { error: "Accès administrateur uniquement" },
              { status: 403 }
            );
          }

          return NextResponse.redirect(
            new URL("/admin/non-autorise", request.url)
          );
        }
      }
    }

    // Set security headers for admin routes
    const response = NextResponse.next();
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");

    return response;
  }

  // Protected API routes
  if (pathname.startsWith("/api")) {
    // Skip auth for public API endpoints
    const publicApiRoutes = [
      "/api/csrf-token",
      "/api/auth",
      "/api/public",
    ];

    const isPublic = publicApiRoutes.some((route) =>
      pathname.startsWith(route)
    );

    if (!isPublic) {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (!token) {
        logSecurityEvent(request, "UNAUTHORIZED_API_ACCESS");
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/:path*",
    "/pointage",
    "/login",
    "/",
  ],
};
