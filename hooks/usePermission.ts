'use client';

import { useSession } from 'next-auth/react';

export function usePermission() {
  const { data: session } = useSession();

  const user = session?.user as any;
  const permissions = user?.permissions || [];
  const role = user?.role || '';

  const hasPermission = (code: string): boolean => {
    return permissions.includes(code);
  };

  const isAdmin = (): boolean => {
    return role === 'Admin';
  };

  return {
    hasPermission,
    isAdmin,
    user,
    role,
    permissions,
  };
}
