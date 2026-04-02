/**
 * File upload validation
 * Prevents malicious file uploads
 */

import { fileTypeFromBuffer } from "file-type";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

/**
 * Validate image upload
 * Checks MIME type using magic bytes, not just extension
 */
export async function validateImageUpload(
  file: File | Buffer
): Promise<{ valid: boolean; error?: string; mimeType?: string }> {
  try {
    let buffer: Buffer;

    if (file instanceof File) {
      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      buffer = file;
    }

    // Check file size
    if (buffer.length > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `La taille du fichier dépasse la limite de 5 Mo (taille actuelle: ${(buffer.length / 1024 / 1024).toFixed(2)} Mo)`,
      };
    }

    // Check file type using magic bytes
    let detectedType: { mime: string; ext: string } | undefined;

    try {
      detectedType = await fileTypeFromBuffer(buffer);
    } catch (error) {
      return {
        valid: false,
        error: "Impossible de déterminer le type de fichier",
      };
    }

    if (!detectedType) {
      return {
        valid: false,
        error: "Type de fichier non reconnu",
      };
    }

    // Verify MIME type
    if (!ALLOWED_MIME_TYPES.includes(detectedType.mime)) {
      return {
        valid: false,
        error: `Type de fichier non autorisé. Acceptés: ${ALLOWED_MIME_TYPES.join(", ")}`,
      };
    }

    // Verify extension matches
    const extension = `.${detectedType.ext}`;
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return {
        valid: false,
        error: `Extension de fichier invalide: ${extension}`,
      };
    }

    return {
      valid: true,
      mimeType: detectedType.mime,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur lors de la validation";
    return {
      valid: false,
      error: `Erreur de validation: ${message}`,
    };
  }
}

/**
 * Sanitize filename
 * Removes dangerous characters and generates unique name
 */
export function sanitizeFilename(
  originalFilename: string,
  extension: string
): string {
  // Generate unique ID to prevent collisions and directory traversal
  const uniqueId = Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  // Extract extension from originalFilename if not provided
  let ext = extension;
  if (!ext && originalFilename.includes(".")) {
    ext = originalFilename.substring(
      originalFilename.lastIndexOf(".")
    );
  }

  // Validate extension
  if (!ALLOWED_EXTENSIONS.includes(ext.toLowerCase())) {
    ext = ".jpg"; // Default to jpg if invalid
  }

  return `${uniqueId}${ext.toLowerCase()}`;
}

/**
 * Generate safe upload path
 */
export function generateUploadPath(filename: string): string {
  // Create nested directories to prevent too many files in one directory
  const timestamp = Date.now();
  const year = new Date(timestamp).getFullYear();
  const month = String(new Date(timestamp).getMonth() + 1).padStart(2, "0");
  const day = String(new Date(timestamp).getDate()).padStart(2, "0");

  return `/uploads/${year}/${month}/${day}/${filename}`;
}

/**
 * Get upload directory (server-side)
 */
export function getUploadDir(): string {
  return process.env.UPLOAD_DIR || ".uploads"; // Outside public directory
}

/**
 * Validate document upload
 */
export async function validateDocumentUpload(
  file: File | Buffer,
  maxSize = 10 * 1024 * 1024 // 10 MB for documents
): Promise<{ valid: boolean; error?: string; mimeType?: string }> {
  try {
    let buffer: Buffer;

    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      buffer = file;
    }

    // Check file size
    if (buffer.length > maxSize) {
      return {
        valid: false,
        error: `La taille du fichier dépasse la limite de ${maxSize / 1024 / 1024} Mo`,
      };
    }

    // Check file type
    const detectedType = await fileTypeFromBuffer(buffer);

    const allowedDocumentMimes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/csv",
    ];

    if (
      !detectedType ||
      !allowedDocumentMimes.includes(detectedType.mime)
    ) {
      return {
        valid: false,
        error: `Type de document non autorisé. Acceptés: PDF, Word, Excel, texte, CSV`,
      };
    }

    return {
      valid: true,
      mimeType: detectedType.mime,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur lors de la validation";
    return {
      valid: false,
      error: `Erreur de validation: ${message}`,
    };
  }
}

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMime(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "application/pdf": ".pdf",
    "text/plain": ".txt",
    "text/csv": ".csv",
  };

  return mimeMap[mimeType] || ".bin";
}

/**
 * Scan for common malicious patterns in files
 * (Basic heuristic scanning)
 */
export async function scanForMalware(buffer: Buffer): Promise<boolean> {
  // Common executable headers
  const suspiciousPatterns = [
    Buffer.from([0x4d, 0x5a]), // MZ (DOS executable)
    Buffer.from([0x7f, 0x45, 0x4c, 0x46]), // ELF (Linux executable)
    Buffer.from([0xca, 0xfe, 0xba, 0xbe]), // Mach-O (Mac executable)
    Buffer.from([0x3c, 0x21, 0x44, 0x4f, 0x43, 0x54, 0x59, 0x50, 0x45]), // DOCTYPE (for HTML injection)
  ];

  for (const pattern of suspiciousPatterns) {
    if (buffer.includes(pattern)) {
      return true; // Malware suspected
    }
  }

  return false;
}
