/**
 * Utilitaires de réponse uniforme
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: unknown;
}

/**
 * Créer une réponse de succès
 */
export function successResponse<T>(
  data?: T,
  message?: string
): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

/**
 * Créer une réponse d'erreur
 */
export function errorResponse(
  error: string,
  details?: unknown
): ApiResponse {
  return {
    success: false,
    error,
    details,
  };
}
