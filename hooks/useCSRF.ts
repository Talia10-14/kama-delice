"use client";

import { useEffect, useState } from "react";

/**
 * Hook for managing CSRF tokens in client-side requests
 */
export function useCSRF() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch CSRF token on component mount
    const fetchToken = async () => {
      try {
        const response = await fetch("/api/csrf-token", {
          method: "GET",
          credentials: "include", // Include cookies
        });

        if (!response.ok) {
          throw new Error("Impossible de récupérer le token CSRF");
        }

        const data = await response.json();
        setToken(data.token);
        setError(null);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erreur inconnue";
        setError(message);
        console.error("CSRF token fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, []);

  /**
   * Add CSRF token to fetch headers
   */
  const addTokenToHeaders = (headers: Record<string, string> = {}): Record<string, string> => {
    if (!token) {
      console.warn("CSRF token not yet loaded");
      return headers;
    }

    return {
      ...headers,
      "x-csrf-token": token,
      "Content-Type": "application/json",
    };
  };

  /**
   * Make a protected fetch request
   */
  const protectedFetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    if (!token) {
      throw new Error("CSRF token not loaded");
    }

    const headers = addTokenToHeaders(
      init?.headers as Record<string, string>
    );

    return fetch(input, {
      ...init,
      headers,
      credentials: "include",
    });
  };

  return {
    token,
    loading,
    error,
    addTokenToHeaders,
    protectedFetch,
  };
}
