/**
 * Password security utilities
 */

import bcrypt from "bcryptjs";

/**
 * Hash password with bcrypt (cost factor 12 for high security)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * Verify password against hash
 * Secure comparison without timing attacks
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validate password strength
 * Returns validation status and specific errors
 */
export function validatePasswordStrength(
  password: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Minimum length
  if (password.length < 8) {
    errors.push("Le mot de passe doit contenir au moins 8 caractères");
  }

  // Maximum length (common limit)
  if (password.length > 128) {
    errors.push("Le mot de passe doit contenir au maximum 128 caractères");
  }

  // At least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une lettre majuscule");
  }

  // At least one lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une lettre minuscule");
  }

  // At least one digit
  if (!/\d/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins un chiffre");
  }

  // At least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push(
      "Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*...)"
    );
  }

  // Not more than 3 consecutive identical characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push(
      "Le mot de passe ne peut pas contenir plus de 3 caractères identiques consécutifs"
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate password strength score (0-100)
 */
export function getPasswordStrength(password: string): number {
  let score = 0;

  // Length
  if (password.length >= 8) score += 10;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  // Character variety
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/\d/.test(password)) score += 15;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15;

  // No consecutive identical characters
  if (!/(.)\1{2,}/.test(password)) score += 10;

  return Math.min(100, score);
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(
  score: number
): "Très faible" | "Faible" | "Moyen" | "Fort" | "Très fort" {
  if (score < 20) return "Très faible";
  if (score < 40) return "Faible";
  if (score < 60) return "Moyen";
  if (score < 80) return "Fort";
  return "Très fort";
}

/**
 * Get password strength color for UI
 */
export function getPasswordStrengthColor(
  score: number
): "red" | "orange" | "yellow" | "green" {
  if (score < 20) return "red";
  if (score < 40) return "orange";
  if (score < 60) return "yellow";
  return "green";
}

/**
 * Check if password has already been used (against list of common passwords)
 */
const commonPasswords = [
  "password",
  "123456",
  "password123",
  "admin",
  "letmein",
  "qwerty",
  "123123",
  "12345678",
  "iloveyou",
  "welcome",
  "monkey",
  "dragon",
  "master",
  "sunshine",
  "princess",
];

export function isCommonPassword(password: string): boolean {
  return commonPasswords.some(
    (common) => password.toLowerCase().includes(common)
  );
}

/**
 * Generate secure password (for temporary passwords)
 */
export function generateSecurePassword(length = 16): string {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
  let password = "";

  // Ensure at least one of each type
  password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[
    Math.floor(Math.random() * 26)
  ];
  password += "abcdefghijklmnopqrstuvwxyz"[
    Math.floor(Math.random() * 26)
  ];
  password += "0123456789"[Math.floor(Math.random() * 10)];
  password += "!@#$%^&*"[Math.floor(Math.random() * 8)];

  // Fill the rest
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Shuffle
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}
