import { z } from "zod"

export const courtSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  address: z
    .string()
    .max(200, "La dirección no puede exceder 200 caracteres")
    .optional()
    .or(z.literal("")),
  city: z
    .string()
    .min(2, "La ciudad debe tener al menos 2 caracteres")
    .max(100, "La ciudad no puede exceder 100 caracteres"),
  capacity: z
    .number()
    .int("Debe ser un número entero")
    .min(0, "La capacidad debe ser positiva")
    .max(100000, "La capacidad no puede exceder 100.000")
    .nullable()
    .optional(),
  googleMapsLink: z
    .string()
    .url("Debe ser una URL válida")
    .max(500, "La URL no puede exceder 500 caracteres")
    .optional()
    .or(z.literal("")),
})

export type CourtFormData = z.input<typeof courtSchema>

export const courtUpdateSchema = courtSchema.partial()
export type CourtUpdateData = z.input<typeof courtUpdateSchema>
