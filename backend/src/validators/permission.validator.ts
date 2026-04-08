/**
 * Validators pour permissions
 */

import { z } from 'zod';

export const grantPermissionSchema = z.object({
  permissionId: z.string().min(1, 'permissionId requis'),
  reason: z.string().max(300, 'Motif limité à 300 caractères').optional(),
});

export const revokePermissionSchema = z.object({
  permissionId: z.string().min(1, 'permissionId requis'),
  reason: z.string().max(300, 'Motif limité à 300 caractères').optional(),
});

export type GrantPermissionInput = z.infer<typeof grantPermissionSchema>;
export type RevokePermissionInput = z.infer<typeof revokePermissionSchema>;
