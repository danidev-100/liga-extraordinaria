import { z } from "zod"

export const createAdminSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  email: z
    .string()
    .email("Email inválido")
    .toLowerCase()
    .trim(),
  leagueId: z
    .string()
    .uuid("Debe seleccionar una liga"),
})

export const updateAdminSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .optional(),
  email: z
    .string()
    .email("Email inválido")
    .toLowerCase()
    .trim()
    .optional(),
  leagueId: z
    .string()
    .uuid("Debe seleccionar una liga")
    .optional(),
})

export type CreateAdminData = z.input<typeof createAdminSchema>
export type UpdateAdminData = z.input<typeof updateAdminSchema>
