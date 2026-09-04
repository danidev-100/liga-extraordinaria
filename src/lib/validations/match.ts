import { z } from "zod"

const matchBaseSchema = z.object({
  categoryId: z.string().uuid("Debe seleccionar una categoría"),
  courtId: z.string().uuid("Debe seleccionar una cancha"),
  date: z.string().min(1, "La fecha es requerida"),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "La hora debe estar en formato 24h (ej: 14:00)"),
  localTeamId: z.string().uuid("Debe seleccionar el equipo local"),
  visitorTeamId: z.string().uuid("Debe seleccionar el equipo visitante"),
  round: z.coerce.number().int().min(1, "La ronda debe ser al menos 1"),
})

export const matchSchema = matchBaseSchema.refine(
  (data) => data.localTeamId !== data.visitorTeamId,
  {
    message: "El equipo local y visitante deben ser diferentes",
    path: ["visitorTeamId"],
  },
)

export type MatchFormData = z.input<typeof matchSchema>

// Separate schema for updates (no refine on partial)
export const matchUpdateSchema = matchBaseSchema.partial()

export type MatchUpdateData = z.input<typeof matchUpdateSchema>
