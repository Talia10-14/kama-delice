/**
 * Validators pour rôles
 */

import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  codeName: z.string().min(1, 'Code requis'),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).optional(),
});

export const updateRoleSchema = createRoleSchema.partial();

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
