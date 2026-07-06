import { z } from "zod"

export const leagueSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  season: z
    .string()
    .min(2, "La temporada debe tener al menos 2 caracteres")
    .max(20, "La temporada no puede exceder 20 caracteres"),
  startDate: z.string().min(1, "La fecha de inicio es requerida"),
  endDate: z.string().min(1, "La fecha de fin es requerida"),
  isActive: z.boolean().default(false),
})

export type LeagueFormData = z.input<typeof leagueSchema>

export const leagueUpdateSchema = leagueSchema.partial()
export type LeagueUpdateData = z.input<typeof leagueUpdateSchema>
