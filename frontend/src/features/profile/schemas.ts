import * as z from "zod";

/**
 * Función para sanitizar texto eliminando HTML y scripts
 * Previene ataques XSS
 */
const sanitizeText = (text: string): string => {
  return text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim();
};

/**
 * Esquema para edición de perfil
 */
export const profileSchema = z.object({
  firstName: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede exceder 50 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ'\s]+$/, "El nombre solo puede contener letras")
    .transform((val) => sanitizeText(val)),
  
  lastName: z
    .string()
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(50, "El apellido no puede exceder 50 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ'\s]+$/, "El apellido solo puede contener letras")
    .transform((val) => sanitizeText(val)),
  
  email: z
    .string()
    .email("Correo inválido")
    .readonly(),
  
  institution: z
    .string()
    .min(1, "Selecciona una institución")
    .max(200, "El nombre de la institución es demasiado largo")
    .transform((val) => sanitizeText(val)),
  
  bio: z
    .string()
    .max(500, "La biografía no puede exceder 500 caracteres")
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      
      // Sanitizar y eliminar URLs peligrosas
      const sanitized = sanitizeText(val);
      
      // Remover URLs javascript: y data:
      const withoutDangerousUrls = sanitized
        .replace(/javascript:/gi, '')
        .replace(/data:/gi, '');
      
      return withoutDangerousUrls.trim() || undefined;
    }),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

/**
 * Esquema para cambio de contraseña (SIN currentPassword)
 */
export const passwordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, "Ingresa tu contrasena actual"),

  newPassword: z
    .string()
    .min(8, "La nueva contrasena debe tener al menos 8 caracteres")
    .max(100, "La contraseña es demasiado larga")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "La contraseña debe contener mayúsculas, minúsculas y números"
    ),
  
  confirmPassword: z
    .string()
    .min(1, "Confirma tu nueva contraseña"),
})
.refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export type PasswordFormData = z.infer<typeof passwordSchema>;

/**
 * Esquema para registro de usuario
 */
export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre es demasiado largo")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ'\s]+$/, "El nombre solo puede contener letras")
    .transform((val) => sanitizeText(val)),
  
  email: z
    .string()
    .email("Correo inválido")
    .toLowerCase()
    .transform((val) => val.trim()),
  
  password: z
    .string()
    .min(8, "Minimo 8 caracteres")
    .max(100, "La contraseña es demasiado larga")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Debe contener mayúsculas, minúsculas y números"
    ),
  
  confirmPassword: z.string(),
  
  isTeacher: z.boolean().default(false),
})
.refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Utilidad: Sanitizar objeto completo
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const sanitized = {} as T;
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeText(value) as T[keyof T];
    } else if (Array.isArray(value)) {
      sanitized[key as keyof T] = value.map(item => 
        typeof item === 'string' ? sanitizeText(item) : item
      ) as T[keyof T];
    } else {
      sanitized[key as keyof T] = value;
    }
  }
  
  return sanitized;
};
