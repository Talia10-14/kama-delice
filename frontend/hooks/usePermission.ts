'use client';

import { useSession } from 'next-auth/react';

/**
 * Hook pour gérer les permissions de l'utilisateur
 */
export function usePermission() {
  const { data: session } = useSession();

  const permissions = (session?.user as any)?.permissions || [];
  const role = (session?.user as any)?.role || '';

  return {
    hasPermission: (permission: string): boolean => {
      if (!session?.user) return false;
      return permissions.includes(permission);
    },
    isAdmin: (): boolean => role === 'Administrateur' || role === 'admin',
    isManager: (): boolean => role === 'Responsable' || role === 'manager',
    isEmployee: (): boolean => role === 'Employé' || role === 'employee' || role === 'user',
    permissions,
    role,
  };
}

export function usePermissions(): string[] {
  const { data: session } = useSession();
  return (session?.user as any)?.permissions || [];
}
