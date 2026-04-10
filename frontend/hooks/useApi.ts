/**
 * Hook custom SWR pour fetch automatique avec caching et refresh
 * Remplace les useEffect + useState répétitifs
 */

import useSWR, { SWRConfiguration } from 'swr';
import { apiClient } from '@/lib/api-client';

interface UseApiOptions extends SWRConfiguration {
  skip?: boolean;
}

/**
 * Hook pour GET requests avec caching SWR
 */
export function useApi<T = unknown>(
  endpoint: string,
  options?: UseApiOptions
) {
  const swrOptions: SWRConfiguration = {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 30000, // 30s dedup
    focusThrottleInterval: 300000, // 5min focus throttle
    ...options,
  };

  const { data, error, isLoading, mutate } = useSWR(
    options?.skip ? null : endpoint,
    async (url) => {
      try {
        const response = await apiClient.get(url);
        return response.data as T;
      } catch (err) {
        throw err;
      }
    },
    swrOptions
  );

  return {
    data: data as T | undefined,
    error,
    isLoading,
    isValidating: isLoading,
    mutate,
  };
}

/**
 * Hook pour POST/PATCH avec optimistic updates
 */
export function useMutation<T = unknown, R = unknown>(
  endpoint: string,
  method: 'post' | 'put' | 'patch' = 'post'
) {
  const { mutate: globalMutate } = useSWR(endpoint);

  const trigger = async (data: T, shouldRevalidate = true) => {
    try {
      let response;
      if (method === 'post') {
        response = await apiClient.post(endpoint, data);
      } else if (method === 'put') {
        response = await apiClient.put(endpoint, data);
      } else {
        response = await apiClient.patch(endpoint, data);
      }

      if (shouldRevalidate) {
        // Revalider le endpoint après la mutation
        globalMutate();
      }

      return response.data as R;
    } catch (err) {
      throw err;
    }
  };

  return { trigger };
}
