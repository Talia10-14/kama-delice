'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/api-client';

// Types pour les permissions
interface Permission {
  id: string;
  name: string;
  codeName: string;
  description?: string;
}

interface EmployeePermissionDetail {
  id: string;
  permission: Permission;
  addedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  reason?: string;
  createdAt: string;
}

interface PermissionsDetail {
  fromRole: Permission[];
  individualGrant: EmployeePermissionDetail[];
  individualRevoke: EmployeePermissionDetail[];
  effective: string[];
}

interface UseEmployeePermissionsReturn {
  data: PermissionsDetail | null;
  loading: boolean;
  error: string | null;
  allPermissions: Permission[];
  loadingPermissions: boolean;
  grant: (permissionId: string, reason?: string) => Promise<void>;
  revoke: (permissionId: string, reason?: string) => Promise<void>;
  reset: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook pour gérer les permissions individuelles d'un employé
 */
export function useEmployeePermissions(employeeId: string): UseEmployeePermissionsReturn {
  const { toast } = useToast();

  const [data, setData] = useState<PermissionsDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  // Charger les permissions disponibles
  const loadAllPermissions = useCallback(async () => {
    try {
      setLoadingPermissions(true);
      const permissions = await apiClient.get<Permission[]>('/permissions');
      setAllPermissions(permissions);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement des permissions';
      console.error('Erreur:', message);
    } finally {
      setLoadingPermissions(false);
    }
  }, []);

  // Charger les permissions de l'employé
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const detail = await apiClient.get<PermissionsDetail>(
        `/employees/${employeeId}/permissions`
      );
      setData(detail);
      
      // Charger aussi les permissions disponibles
      if (allPermissions.length === 0) {
        await loadAllPermissions();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement des permissions';
      setError(message);
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [employeeId, allPermissions.length, loadAllPermissions, toast]);

  // Ajouter une permission (GRANT)
  const grant = useCallback(
    async (permissionId: string, reason?: string) => {
      try {
        setLoading(true);
        const detail = await apiClient.post<PermissionsDetail>(
          `/employees/${employeeId}/permissions/grant`,
          { permissionId, reason }
        );
        setData(detail);
        toast({
          title: 'Succès',
          description: 'Permission ajoutée avec succès',
          variant: 'default',
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur lors de l\'ajout de permission';
        setError(message);
        toast({
          title: 'Erreur',
          description: message,
          variant: 'destructive',
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [employeeId, toast]
  );

  // Retirer une permission (REVOKE)
  const revoke = useCallback(
    async (permissionId: string, reason?: string) => {
      try {
        setLoading(true);
        const detail = await apiClient.post<PermissionsDetail>(
          `/employees/${employeeId}/permissions/revoke`,
          { permissionId, reason }
        );
        setData(detail);
        toast({
          title: 'Succès',
          description: 'Permission retirée avec succès',
          variant: 'default',
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur lors du retrait de permission';
        setError(message);
        toast({
          title: 'Erreur',
          description: message,
          variant: 'destructive',
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [employeeId, toast]
  );

  // Réinitialiser toutes les permissions
  const reset = useCallback(async () => {
    try {
      setLoading(true);
      await apiClient.delete(`/employees/${employeeId}/permissions/reset`);
      await refresh();
      toast({
        title: 'Succès',
        description: 'Permissions réinitialisées avec succès',
        variant: 'default',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la réinitialisation';
      setError(message);
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [employeeId, refresh, toast]);

  return {
    data,
    loading,
    error,
    allPermissions,
    loadingPermissions,
    grant,
    revoke,
    reset,
    refresh,
  };
}
