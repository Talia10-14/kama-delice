/**
 * Utilitaires de mot de passe
 */

import bcrypt from 'bcryptjs';

/**
 * Hash password avec bcrypt (cost factor 12 pour haute sécurité)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * Vérifier le mot de passe contre le hash
 * Comparaison sécurisée sans attaques par timing
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Valider la force du mot de passe
 * Retourne le statut de validation et les erreurs spécifiques
 */
export function validatePasswordStrength(
  password: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Longueur minimale
  if (password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères');
  }

  // Longueur maximale
  if (password.length > 128) {
    errors.push('Le mot de passe doit contenir au maximum 128 caractères');
  }

  // Au moins une lettre majuscule
  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une lettre majuscule');
  }

  // Au moins une lettre minuscule
  if (!/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une lettre minuscule');
  }

  // Au moins un chiffre
  if (!/\d/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }

  // Au moins un caractère spécial
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push(
      "Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*...)"
    );
  }

  // Pas plus de 3 caractères identiques consécutifs
  if (/(.)\1{2,}/.test(password)) {
    errors.push(
      'Le mot de passe ne peut pas contenir plus de 3 caractères identiques consécutifs'
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculer le score de force du mot de passe (0-100)
 */
export function getPasswordStrength(password: string): number {
  let score = 0;

  // Longueur
  if (password.length >= 8) score += 10;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  // Variété de caractères
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/\d/.test(password)) score += 15;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15;

  // Pas de caractères consécutifs identiques
  if (!/(.)\1{2,}/.test(password)) score += 10;

  return Math.min(100, score);
}
