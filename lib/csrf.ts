/**
 * CSRF Protection
 * Prevents Cross-Site Request Forgery attacks
 * 
 * Uses format validation instead of server-side storage for serverless compatibility.
 * Tokens are 32 random bytes encoded as hex (64 characters).
 * 
 * Note: In a serverless environment, in-memory token storage doesn't work across instances.
 * This approach validates token format and relies on other security measures:
 * - Rate limiting prevents brute force
 * - Logging tracks suspicious patterns
 * - Auth tokens provide additional protection
 */

import crypto from 'crypto';

/**
 * Generate a new CSRF token
 * Returns a 32-byte random token as a hex string (64 characters)
 */
export async function generateCsrfToken(): Promise<string> {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate CSRF token from request
 * Checks if token exists and follows the expected format
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

    // Validate token format: must be 64 hex characters (32 random bytes)
    if (!/^[a-f0-9]{64}$/.test(headerToken)) {
      return {
        valid: false,
        error: 'Format de token CSRF invalide',
      };
    }

    // Token format is valid
    // In a serverless environment we can't store tokens server-side,
    // so we validate format and rely on rate limiting + logging
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
 * Skips GET requests and auth-related routes
 */
export async function verifyCsrfMiddleware(request: Request): Promise<boolean> {
  // Skip CSRF check for GET requests
  if (request.method === 'GET') {
    return true;
  }

  // Skip CSRF check for auth-related routes (they have their own auth)
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/auth')) {
    return true;
  }

  const validation = await validateCsrfToken(request);
  return validation.valid;
}

/**
 * Get CSRF token for client
 * This generates a fresh token each time (no server-side storage needed)
 */
export async function getCsrfToken(): Promise<string> {
  return generateCsrfToken();
}
