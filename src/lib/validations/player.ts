import { z } from "zod"

export const playerSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede exceder 50 caracteres"),
  surname: z
    .string()
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(50, "El apellido no puede exceder 50 caracteres"),
  dni: z
    .string()
    .min(5, "El DNI debe tener al menos 5 caracteres")
    .max(20, "El DNI no puede exceder 20 caracteres"),
  birthDate: z.string().min(1, "La fecha de nacimiento es requerida"),
  jerseyNumber: z
    .number()
    .int("Debe ser un número entero")
    .min(0, "El número debe ser positivo")
    .max(99, "El número no puede exceder 99")
    .nullable()
    .optional(),
  teamId: z.string().uuid("Debe seleccionar un equipo"),
  isActive: z.boolean().default(true),
})

export type PlayerFormData = z.input<typeof playerSchema>

export const playerUpdateSchema = playerSchema.partial()
export type PlayerUpdateData = z.input<typeof playerUpdateSchema>
