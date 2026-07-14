import { z } from "zod"

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(50, "El nombre no puede exceder 50 caracteres"),
  minAge: z
    .number()
    .int("Debe ser un número entero")
    .min(4, "La edad mínima debe ser al menos 4")
    .max(100, "La edad mínima no puede exceder 100"),
  maxAge: z
    .number()
    .int("Debe ser un número entero")
    .min(4, "La edad máxima debe ser al menos 4")
    .max(100, "La edad máxima no puede exceder 100"),
  leagueId: z.string().uuid("Debe seleccionar una liga"),
  isActive: z.boolean().default(true),
})

export type CategoryFormData = z.input<typeof categorySchema>

export const categoryUpdateSchema = categorySchema.partial()
export type CategoryUpdateData = z.input<typeof categoryUpdateSchema>
