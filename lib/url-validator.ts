/**
 * URL validation to prevent phishing attacks
 */

/**
 * Check if URL is internal (same domain)
 * Prevents redirect attacks to external sites
 */
export function isInternalUrl(url: unknown): boolean {
  // Handle null/undefined
  if (!url || typeof url !== "string") {
    return false;
  }

  // Check for common phishing patterns
  if (url.includes("//") && !url.startsWith("/")) {
    try {
      const parsedUrl = new URL(url);
      const currentHost = new URL(
        typeof window !== "undefined"
          ? window.location.href
          : `http://localhost`
      ).host;

      return parsedUrl.host === currentHost;
    } catch {
      return false;
    }
  }

  // Relative URLs are safe
  if (url.startsWith("/") || url.startsWith("?") || url.startsWith("#")) {
    return true;
  }

  // Protocol-relative URLs are not safe
  if (url.startsWith("//")) {
    return false;
  }

  return false;
}

/**
 * Validate callback URL for redirects after login
 */
export function validateCallbackUrl(
  callbackUrl: unknown,
  defaultUrl = "/admin"
): string {
  if (isInternalUrl(callbackUrl)) {
    return String(callbackUrl);
  }

  return defaultUrl;
}

/**
 * Validate redirect URL
 */
export function validateRedirectUrl(
  redirectUrl: unknown,
  allowedDomains: string[] = []
): string | null {
  if (typeof redirectUrl !== "string") {
    return null;
  }

  try {
    const url = new URL(redirectUrl);

    // Check if domain is in allowed list
    const isAllowed = allowedDomains.some(
      (domain) => url.hostname === domain
    );

    if (!isAllowed && !isInternalUrl(redirectUrl)) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Extract and validate origin from request
 */
export function getRequestOrigin(request: Request): string | null {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (origin && isValidOrigin(origin)) {
    return origin;
  }

  if (referer) {
    try {
      const url = new URL(referer);
      return url.origin;
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Validate origin header
 */
export function isValidOrigin(origin: unknown): boolean {
  if (typeof origin !== "string") {
    return false;
  }

  try {
    const url = new URL(origin);
    

    // Accept localhost for development
    if (process.env.NODE_ENV === "development") {
      if (
        url.hostname === "localhost" ||
        url.hostname === "127.0.0.1" ||
        url.hostname.endsWith(".local")
      ) {
        return true;
      }
    }

    // Accept configured domains
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
    return allowedOrigins.some((allowed) => url.origin === allowed.trim());
  } catch {
    return false;
  }
}

/**
 * Sanitize URL to prevent XSS through URL parameters
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove potentially dangerous search params
    const dangerousParams = ["script", "onerror", "onload", "eval"];
    dangerousParams.forEach((param) => {
      parsed.searchParams.delete(param);
    });
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Check for open redirect attempts
 */
export function detectOpenRedirect(
  targetUrl: unknown
): { isOpenRedirect: boolean; message?: string } {
  if (typeof targetUrl !== "string") {
    return { isOpenRedirect: false };
  }

  // Protocol-relative URLs (// at start)
  if (targetUrl.startsWith("//")) {
    return {
      isOpenRedirect: true,
      message: "Protocol-relative URL detected",
    };
  }

  // Absolute URLs with different domain
  try {
    if (targetUrl.includes("://")) {
      const url = new URL(targetUrl);
      const currentHost = typeof window !== "undefined" 
        ? window.location.hostname 
        : "localhost";
      
      if (url.hostname !== currentHost) {
        return {
          isOpenRedirect: true,
          message: "Redirect to different domain detected",
        };
      }
    }
  } catch {
    return { isOpenRedirect: false };
  }

  return { isOpenRedirect: false };
}
