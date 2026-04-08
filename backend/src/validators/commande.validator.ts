/**
 * Validators pour commandes
 */

import { z } from 'zod';

export const createCommandeSchema = z.object({
  clientId: z.string().optional(),
  items: z.array(
    z.object({
      menuId: z.string(),
      quantity: z.number().min(1),
      price: z.number().min(0),
    })
  ),
  totalPrice: z.number().min(0),
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']).optional(),
  notes: z.string().optional(),
});

export const updateCommandeSchema = createCommandeSchema.partial();

export type CreateCommandeInput = z.infer<typeof createCommandeSchema>;
export type UpdateCommandeInput = z.infer<typeof updateCommandeSchema>;
