import { z } from "zod"
export const courtSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100, "El nombre no puede exceder 100 caracteres"),
  venueId: z.string().uuid("Debe seleccionar un lugar"),
  capacity: z.number().int("Debe ser un número entero").min(0, "La capacidad debe ser positiva").max(100000, "La capacidad no puede exceder 100.000").nullable().optional(),
})
export type CourtFormData = z.input<typeof courtSchema>
export const courtUpdateSchema = courtSchema.partial()
export type CourtUpdateData = z.input<typeof courtUpdateSchema>