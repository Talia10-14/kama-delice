/**
 * Client HTTP centralisé pour communiquer avec le backend Express
 * Remplace tous les appels fetch dispersés dans l'application
 */

import { getSession, signOut } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: unknown;
}

/**
 * Classe du client API
 */
class ApiClient {
  private apiUrl: string;

  constructor(apiUrl: string = API_URL) {
    this.apiUrl = apiUrl;
  }

  /**
   * Obtenir les headers avec le token d'authentification
   */
  private async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const session = await getSession();
    if ((session as any)?.accessToken) {
      headers.Authorization = `Bearer ${(session as any).accessToken}`;
    }

    return headers;
  }

  /**
   * Gérer les réponses d'erreur
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const data: ApiResponse<T> = await response.json();

    // Si 401, le token a peut-être expiré
    if (response.status === 401) {
      // Essayer de rafraîchir le token
      const refreshed = await this.refreshToken();
      if (!refreshed) {
        // Afraîchissement échoué, se déconnecter
        await signOut({ redirect: true, callbackUrl: '/login' });
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

      // Relancer la requête avec le nouveau token
      return this.retryRequest<T>(response.url);
    }

    // Si la réponse n'est pas ok, lever une erreur
    if (!response.ok) {
      const errorMessage =
        data.error || 'Une erreur est survenue lors de la requête';
      const error = new Error(errorMessage);
      (error as any).details = data.details;
      throw error;
    }

    // Retourner les données
    if (!data.success && data.error) {
      const error = new Error(data.error);
      (error as any).details = data.details;
      throw error;
    }

    return data.data as T;
  }

  /**
   * Relancer une requête après rafraîchissement du token
   */
  private async retryRequest<T>(url: string): Promise<T> {
    const method = 'GET'; // Simplifier pour le retry
    const headers = await this.getHeaders();

    const response = await fetch(url, {
      method,
      headers,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Rafraîchir le token d'accès
   */
  private async refreshToken(): Promise<boolean> {
    try {
      const session = await getSession();
      if (!(session as any)?.refreshToken) {
        return false;
      }

      const response = await fetch(`${this.apiUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: (session as any).refreshToken }),
      });

      if (!response.ok) {
        return false;
      }

      const data: ApiResponse = await response.json();
      if (!data.success || !data.data) {
        return false;
      }

      // Le nouveau token est sauvegardé via la session NextAuth
      // (ce callback doit être implémenté dans le route.ts NextAuth)
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Requête GET
   */
  async get<T = unknown>(
    endpoint: string,
    options?: { params?: Record<string, unknown> }
  ): Promise<T> {
    const url = new URL(endpoint, this.apiUrl);

    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const headers = await this.getHeaders();

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Requête POST
   */
  async post<T = unknown>(endpoint: string, body?: unknown): Promise<T> {
    const url = new URL(endpoint, this.apiUrl);
    const headers = await this.getHeaders();

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Requête PUT
   */
  async put<T = unknown>(endpoint: string, body?: unknown): Promise<T> {
    const url = new URL(endpoint, this.apiUrl);
    const headers = await this.getHeaders();

    const response = await fetch(url.toString(), {
      method: 'PUT',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Requête DELETE
   */
  async delete<T = unknown>(endpoint: string): Promise<T> {
    const url = new URL(endpoint, this.apiUrl);
    const headers = await this.getHeaders();

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Upload un fichier
   */
  async upload<T = unknown>(endpoint: string, formData: FormData): Promise<T> {
    const url = new URL(endpoint, this.apiUrl);
    const session = await getSession();

    const headers: Record<string, string> = {};
    if ((session as any)?.accessToken) {
      headers.Authorization = `Bearer ${(session as any).accessToken}`;
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: formData,
    });

    return this.handleResponse<T>(response);
  }
}

// Exporter une instance unique du client
export const apiClient = new ApiClient();

// Exporter laclasse aussi pour les tests
export default ApiClient;
