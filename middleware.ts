import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

const permissionMap: Record<string, string> = {
  '/admin/commandes': 'voir_commandes',
  '/admin/menus': 'gerer_menus',
  '/admin/rh': 'gerer_personnel',
  '/admin/finances': 'voir_rapports',
  '/admin/messages': 'gerer_messages',
  '/admin/parametres': 'admin_uniquement',
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow pointage page (no auth required)
  if (pathname === '/pointage') {
    return NextResponse.next();
  }

  // Check if route requires authentication
  if (pathname.startsWith('/admin')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Not authenticated
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check permissions for specific routes (skip dashboard)
    if (pathname.startsWith('/admin') && pathname !== '/admin') {
      const requiredPermission = Object.entries(permissionMap).find(
        ([route]) => pathname.startsWith(route)
      )?.[1];

      if (requiredPermission) {
        const userPermissions = (token.permissions as string[]) || [];

        if (
          requiredPermission !== 'admin_uniquement' &&
          !userPermissions.includes(requiredPermission)
        ) {
          return NextResponse.redirect(
            new URL('/admin/non-autorise', request.url)
          );
        }

        if (
          requiredPermission === 'admin_uniquement' &&
          token.role !== 'Admin'
        ) {
          return NextResponse.redirect(
            new URL('/admin/non-autorise', request.url)
          );
        }
      }
    }

    return NextResponse.next();
  }

  // Redirect to login if trying to access protected routes without auth
  if (pathname.startsWith('/admin') || pathname.startsWith('/pointage')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token && pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/pointage', '/login'],
};
