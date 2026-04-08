/**
 * Validators pour les formulaires
 */

import { z } from 'zod';

export const validators = {
  email: (value: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value);
  },
  phone: (value: string) => {
    const regex = /^[\d\s\-\+\(\)]+$/;
    return regex.test(value) && value.replace(/\D/g, '').length >= 10;
  },
  password: (value: string) => {
    return value.length >= 8;
  },
  minLength: (value: string, min: number) => {
    return value.length >= min;
  },
  maxLength: (value: string, max: number) => {
    return value.length <= max;
  },
};

// Schemas Zod
export const employeeFormSchema = z.object({
  email: z.string().email('Email invalide'),
  firstName: z.string().min(1, 'Prénom requis').optional(),
  lastName: z.string().min(1, 'Nom requis').optional(),
  prenom: z.string().optional(), // Old name
  nom: z.string().optional(), // Old name
  phone: z.string().optional(),
  roleId: z.string().optional(),
  typeContrat: z.string().optional(),
  dateEntree: z.string().optional(),
  dateFin: z.string().optional(),
  statut: z.string().optional(),
});

export const employeeSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().optional(),
  roleId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type EmployeeFormData = z.infer<typeof employeeFormSchema>;
