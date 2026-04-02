/**
 * Sanitization utilities to prevent injection attacks
 */

import validator from "validator";

/**
 * Sanitize a string input
 * Removes HTML tags and dangerous characters
 */
export function sanitizeString(input: unknown, maxLength = 500): string {
  if (typeof input !== "string") {
    return "";
  }

  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, "");

  // Trim whitespace
  sanitized = sanitized.trim();

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize and validate email
 */
export function sanitizeEmail(input: unknown): string | null {
  if (typeof input !== "string") {
    return null;
  }

  const email = sanitizeString(input, 254); // Max email length
  
  if (!validator.isEmail(email)) {
    return null;
  }

  return email.toLowerCase();
}

/**
 * Sanitize and validate telephone number
 * Accepts: +229XXXXXXXX, +33..., etc.
 */
export function sanitizeTelephone(input: unknown): string | null {
  if (typeof input !== "string") {
    return null;
  }

  // Remove all non-digit and non-plus characters
  const cleaned = input.replace(/[^\d+\-\s]/g, "");

  // Check if it matches a phone pattern (+ followed by 10-15 digits)
  const phoneRegex = /^\+[1-9]\d{9,14}$/;
  
  if (!phoneRegex.test(cleaned)) {
    return null;
  }

  return cleaned;
}

/**
 * Sanitize and validate numbers
 */
export function sanitizeNumber(input: unknown): number | null {
  if (typeof input === "number") {
    return isFinite(input) ? input : null;
  }

  if (typeof input === "string") {
    const num = parseFloat(input);
    return isFinite(num) ? num : null;
  }

  return null;
}

/**
 * Sanitize object recursively
 * Applies sanitizeString to all string values
 */
export function sanitizeObject(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = sanitizeString(value);
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === "string" ? sanitizeString(item) : item
      );
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Sanitize UUID v4 format
 */
export function sanitizeUUID(input: unknown): string | null {
  if (typeof input !== "string") {
    return null;
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  return uuidRegex.test(input) ? input : null;
}

/**
 * Sanitize alphanumeric string
 */
export function sanitizeAlphanumeric(input: unknown): string | null {
  if (typeof input !== "string") {
    return null;
  }

  const sanitized = input.replace(/[^a-zA-Z0-9_-]/g, "");
  
  return sanitized.length > 0 ? sanitized : null;
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(input: unknown): string | null {
  if (typeof input !== "string") {
    return null;
  }

  try {
    // Parse the URL to ensure it's valid
    const url = new URL(input);
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitize JSON string
 */
export function sanitizeJSON(
  input: unknown
): Record<string, unknown> | null {
  if (typeof input !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(input);
    return typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}
