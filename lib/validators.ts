import { z } from "zod";

// Regex patterns
const PHONE_REGEX = /^\+[1-9]\d{9,14}$/;
const NAME_REGEX = /^[a-zA-ZÀ-ÿ\s'-]+$/;
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Common schemas
export const emailSchema = z
  .string()
  .email("Email invalide")
  .max(254, "Email trop long");

export const phoneSchema = z
  .string()
  .regex(PHONE_REGEX, "Le téléphone doit être au format: +229XXXXXXXX (ex: +22965432109)");

export const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  .regex(
    PASSWORD_REGEX,
    "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial"
  );

export const nameSchema = z
  .string()
  .min(2, "Le nom doit contenir au moins 2 caractères")
  .max(50, "Le nom doit contenir au maximum 50 caractères")
  .regex(NAME_REGEX, "Le nom peut seulement contenir des lettres, espaces et tirets");

// Entity schemas

export const employeeSchema = z.object({
  nom: nameSchema,
  prenom: nameSchema,
  telephone: phoneSchema.optional().nullable(),
  email: emailSchema.optional().nullable(),
  typeContrat: z.enum(["EMPLOYE", "STAGIAIRE", "PRESTATAIRE"]),
  dateEntree: z
    .string()
    .min(1, "La date d'entrée est requise")
    .transform((val) => new Date(val))
    .refine(
      (date) => !isNaN(date.getTime()) && date <= new Date(),
      "La date d'entrée ne peut pas être dans le futur"
    ),
  dateFin: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val ? new Date(val) : null)
    .refine(
      (date) => {
        if (!date) return true;
        return !isNaN(date.getTime()) && date > new Date();
      },
      "La date de fin doit être dans le futur"
    ),
  statut: z.enum(["ACTIF", "INACTIF"]).optional(),
  roleId: z.union([
    z.number().int().positive("ID de rôle invalide"),
    z.string().transform((val) => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed <= 0) throw new Error("ID de rôle invalide");
      return parsed;
    })
  ]).optional(),
});

export type EmployeeInput = z.infer<typeof employeeSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Le mot de passe est requis"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const commandeSchema = z.object({
  orderNumber: z.string().min(1, "Le numéro de commande est requis").max(100),
  clientName: z.string().min(2, "Le nom du client est requis").max(100),
  content: z.string().min(1, "Les détails sont requis").max(5000),
  amount: z
    .number()
    .positive("Le montant doit être positif")
    .max(9999999, "Le montant dépasse la limite"),
  status: z.enum(["PENDING", "CONFIRMED", "PREPARING", "READY", "DELIVERED", "CANCELLED"]).optional(),
  clientPhone: z.string().optional().refine((phone) => !phone || /^\+?[0-9\s\-()]{8,}$/.test(phone), "Numéro invalide"),
  customOrder: z.boolean().optional(),
});

export type CommandeInput = z.infer<typeof commandeSchema>;

export const messageSchema = z.object({
  senderName: z.string().min(2, "Le nom est requis").max(100),
  senderEmail: emailSchema,
  senderPhone: z.string().optional().refine((phone) => !phone || /^\+?[0-9\s\-()]{8,}$/.test(phone), "Numéro invalide"),
  subject: z.string().min(5, "Le sujet doit contenir au moins 5 caractères").max(200),
  content: z.string().min(10, "Le message doit contenir au moins 10 caractères").max(5000),
});

export type MessageInput = z.infer<typeof messageSchema>;

export const attendanceSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Le mot de passe est requis"),
});

export type AttendanceInput = z.infer<typeof attendanceSchema>;

export const otpSchema = z.object({
  telephone: phoneSchema,
  code: z
    .string()
    .length(6, "Le code OTP doit contenir exactement 6 chiffres")
    .regex(/^\d+$/, "Le code OTP doit contenir uniquement des chiffres"),
});

export type OTPInput = z.infer<typeof otpSchema>;

export const createOTPSchema = z.object({
  telephone: phoneSchema,
});

export type CreateOTPInput = z.infer<typeof createOTPSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Le mot de passe actuel est requis"),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  }
);

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const menuSchema = z.object({
  nom: z
    .string()
    .min(2, "Le nom du menu doit contenir au moins 2 caractères")
    .max(100, "Le nom du menu doit contenir au maximum 100 caractères"),
  description: z
    .string()
    .max(500, "La description doit contenir au maximum 500 caractères")
    .optional(),
  prix: z
    .number()
    .positive("Le prix doit être positif")
    .max(9999999, "Le prix dépasse la limite"),
  disponible: z.boolean().optional(),
});

export type MenuInput = z.infer<typeof menuSchema>;

// Helper function to validate and return friendly error messages
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: boolean; data?: T; errors?: Record<string, string> } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join(".");
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { _error: "Erreur de validation" } };
  }
}
