import { z } from "zod"

export const teamSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  shortName: z
    .string()
    .min(1, "El nombre corto es requerido")
    .max(10, "El nombre corto no puede exceder 10 caracteres"),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "El color debe ser un hex válido (ej: #FF0000)")
    .optional()
    .or(z.literal("")),
  categoryId: z.string().uuid("Debe seleccionar una categoría"),
  logoUrl: z
    .string()
    .url("Debe ser una URL válida")
    .optional()
    .or(z.literal("")),
})

export type TeamFormData = z.input<typeof teamSchema>

export const teamUpdateSchema = teamSchema.partial()
export type TeamUpdateData = z.input<typeof teamUpdateSchema>
