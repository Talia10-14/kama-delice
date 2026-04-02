/**
 * Cryptographic utilities
 * Encrypts and decrypts sensitive data
 */

import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  console.warn(
    "ENCRYPTION_KEY must be set and exactly 32 characters for AES-256"
  );
}

/**
 * Encrypt data with AES-256-GCM
 */
export function encryptData(data: string): string | null {
  try {
    if (!ENCRYPTION_KEY) {
      console.error("ENCRYPTION_KEY is not configured");
      return null;
    }

    // Generate random IV
    const iv = crypto.randomBytes(12);

    // Create cipher
    const cipher = crypto.createCipheriv(
      "aes-256-gcm",
      Buffer.from(ENCRYPTION_KEY, "utf-8"),
      iv
    );

    // Encrypt data
    let encrypted = cipher.update(data, "utf-8", "hex");
    encrypted += cipher.final("hex");

    // Get auth tag
    const authTag = cipher.getAuthTag();

    // Combine IV, auth tag, and encrypted data
    const result = iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted;

    return result;
  } catch (error) {
    console.error("Encryption error:", error);
    return null;
  }
}

/**
 * Decrypt data with AES-256-GCM
 */
export function decryptData(encrypted: string): string | null {
  try {
    if (!ENCRYPTION_KEY) {
      console.error("ENCRYPTION_KEY is not configured");
      return null;
    }

    // Split encrypted data
    const parts = encrypted.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted data format");
    }

    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encryptedData = parts[2];

    // Create decipher
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      Buffer.from(ENCRYPTION_KEY, "utf-8"),
      iv
    );

    // Set auth tag
    decipher.setAuthTag(authTag);

    // Decrypt data
    let decrypted = decipher.update(encryptedData, "hex", "utf-8");
    decrypted += decipher.final("utf-8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
}

/**
 * Hash sensitive data (one-way)
 * Use for storing phone numbers, etc.
 */
export function hashSensitiveData(data: string): string {
  return crypto
    .createHash("sha256")
    .update(data)
    .digest("hex");
}

/**
 * Generate random token
 */
export function generateRandomToken(length = 32): string {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);
}

/**
 * Constant-time string comparison
 * Prevents timing attacks
 */
export function timingSafeEqual(a: string, b: string): boolean {
  try {
    return crypto.timingSafeEqual(
      Buffer.from(a),
      Buffer.from(b)
    );
  } catch {
    // If lengths don't match, still return false (timing safe)
    return false;
  }
}

/**
 * Generate HMAC signature
 */
export function generateSignature(
  data: string,
  secret: string = ENCRYPTION_KEY || "default"
): string {
  return crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("hex");
}

/**
 * Verify HMAC signature
 */
export function verifySignature(
  data: string,
  signature: string,
  secret: string = ENCRYPTION_KEY || "default"
): boolean {
  const expectedSignature = generateSignature(data, secret);
  return timingSafeEqual(signature, expectedSignature);
}

/**
 * Generate API key
 */
export function generateApiKey(): string {
  const prefix = "kad_"; // Kama Délices
  const randomPart = generateRandomToken(32);
  return prefix + randomPart;
}

/**
 * Hash API key for storage
 */
export function hashApiKey(apiKey: string): string {
  return crypto
    .createHash("sha256")
    .update(apiKey)
    .digest("hex");
}
