/**
 * Service d'encryptage/décryptage
 */

import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  console.warn(
    'ENCRYPTION_KEY must be set and exactly 32 characters for AES-256'
  );
}

/**
 * Encrypter les données avec AES-256-GCM
 */
export function encryptData(data: string): string | null {
  try {
    if (!ENCRYPTION_KEY) {
      console.error('ENCRYPTION_KEY is not configured');
      return null;
    }

    // Générer un IV aléatoire
    const iv = crypto.randomBytes(12);

    // Créer le cipher
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      Buffer.from(ENCRYPTION_KEY, 'utf-8'),
      iv
    );

    // Encrypter les données
    let encrypted = cipher.update(data, 'utf-8', 'hex');
    encrypted += cipher.final('hex');

    // Obtenir le tag d'authentification
    const authTag = cipher.getAuthTag();

    // Combiner IV, auth tag, et données encryptées
    const result =
      iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;

    return result;
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
}

/**
 * Décrypter les données avec AES-256-GCM
 */
export function decryptData(encrypted: string): string | null {
  try {
    if (!ENCRYPTION_KEY) {
      console.error('ENCRYPTION_KEY is not configured');
      return null;
    }

    // Diviser les données encryptées
    const parts = encrypted.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedData = parts[2];

    // Créer le decipher
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(ENCRYPTION_KEY, 'utf-8'),
      iv
    );

    // Définir le auth tag
    decipher.setAuthTag(authTag);

    // Décrypter les données
    let decrypted = decipher.update(encryptedData, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

/**
 * Hasher les données sensibles (one-way)
 * Utiliser pour stocker les numéros de téléphone, etc.
 */
export function hashSensitiveData(data: string): string {
  return crypto
    .createHash('sha256')
    .update(data + (ENCRYPTION_KEY || 'default-salt'))
    .digest('hex');
}
