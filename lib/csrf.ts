/**
 * CSRF Protection
 * Prevents Cross-Site Request Forgery attacks
 */

import crypto from 'crypto';

// In-memory token store (in production, use Redis or a database)
const tokenStore = new Map<string, { token: string; expiresAt: number }>();

const TOKEN_EXPIRY = 3600000; // 1 hour in milliseconds

/**
 * Generate a new CSRF token
 */
export async function generateCsrfToken(): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const sessionId = crypto.randomBytes(16).toString('hex');
  
  tokenStore.set(sessionId, {
    token,
    expiresAt: Date.now() + TOKEN_EXPIRY,
  });

  return token;
}

/**
 * Validate CSRF token from request
 */
export async function validateCsrfToken(
  request: Request
): Promise<{ valid: boolean; error?: string }> {
  try {
    const headerToken = request.headers.get('x-csrf-token');

    if (!headerToken) {
      return {
        valid: false,
        error: 'Token CSRF manquant dans les headers',
      };
    }

    // Simple validation: check if token exists and is not expired
    let found = false;
    for (const [_key, { token, expiresAt }] of tokenStore.entries()) {
      if (token === headerToken) {
        if (Date.now() > expiresAt) {
          return {
            valid: false,
            error: 'Token CSRF expiré',
          };
        }
        found = true;
        break;
      }
    }

    if (!found) {
      return {
        valid: false,
        error: 'Token CSRF invalide',
      };
    }

    return { valid: true };
  } catch (error) {
    console.error('CSRF validation error:', error);
    return {
      valid: false,
      error: 'Erreur lors de la validation du token CSRF',
    };
  }
}

/**
 * Middleware to check CSRF token on protected routes
 */
export async function verifyCsrfMiddleware(request: Request): Promise<boolean> {
  // Skip CSRF check for GET requests
  if (request.method === "GET") {
    return true;
  }

  // Skip CSRF check for API routes that have their own auth
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/auth")) {
    return true;
  }

  const validation = await validateCsrfToken(request);
  return validation.valid;
}

/**
 * Get CSRF token for SSR/server components
 * This would be called during server-side rendering
 */
export async function getCsrfToken(): Promise<string> {
  return generateCsrfToken();
}

/**
 * Clear expired tokens (cleanup)
 */
export function clearExpiredTokens(): void {
  const now = Date.now();
  for (const [key, { expiresAt }] of tokenStore.entries()) {
    if (now > expiresAt) {
      tokenStore.delete(key);
    }
  }
}
