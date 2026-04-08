import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// Map des routes vers les permissions requises
// Si null = page accessible à tous les authentifiés
// Si string = nécessite cette permission
const permissionMap: Record<string, string | null> = {
  "/admin/commandes": "manage_commandes",
  "/admin/menus": "manage_menus",
  "/admin/rh": "create_employee", // Gestion des ressources humaines
  "/admin/finances": "manage_finances",
  "/admin/messages": "manage_messages",
  "/admin/parametres": null, // Accessible à tous les authentifiés pour maintenant
};

/**
 * Valider l'origine de la requête pour prévenir les attaques de phishing
 */
function validateRequestOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // Autoriser les requêtes sans origin (requêtes GET, etc.)
  if (!origin && !referer) {
    return true;
  }

  // Obtenir l'origine attendue à partir de l'URL de la requête
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

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Vérification de sécurité : valider l'origine pour les requêtes POST/PUT/DELETE
  if (["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
    if (!validateRequestOrigin(request)) {
      return NextResponse.json(
        { error: "Requête non autorisée" },
        { status: 403 }
      );
    }
  }

  // Autoriser les routes publiques
  if (pathname === "/pointage" || pathname === "/login" || pathname === "/") {
    return NextResponse.next();
  }

  // Autoriser les routes d'initialisation sans authentification
  if (
    pathname === "/api/admin/init-db" ||
    pathname === "/api/admin/debug-env" ||
    pathname === "/api/admin/migrate-db"
  ) {
    return NextResponse.next();
  }

  // Vérifier si la route nécessite une authentification
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Non authentifié
    if (!token) {
      if (pathname.startsWith("/api")) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Utilisateur authentifié - vérifier les permissions pour les routes spécifiques
    if (pathname.startsWith("/admin") && pathname !== "/admin") {
      const userPermissions = (token.permissions as string[]) || [];
      
      // Trouver la permission requise pour cette route
      const requiredPermission = Object.entries(permissionMap).find(
        ([route]) => pathname.startsWith(route)
      )?.[1];

      // Si la route a une permission requise
      if (requiredPermission) {
        // Vérifier si l'utilisateur a cette permission
        if (!userPermissions.includes(requiredPermission)) {
          // Accès refusé
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
      }
      // Si requiredPermission est null, c'est accessible à tous les authentifiés
    }

    // Autorisé - appliquer les en-têtes de sécurité
    const response = NextResponse.next();
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    return response;
  }

  // Routes API protégées
  if (pathname.startsWith("/api")) {
    // Ignorer l'auth pour les endpoints API publics
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
