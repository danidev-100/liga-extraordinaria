import { z } from "zod"

export const goalSchema = z.object({
  playerId: z.string().uuid(),
  teamId: z.string().uuid(),
  minute: z.coerce.number().int().min(1, "El minuto debe ser entre 1 y 120").max(120, "El minuto debe ser entre 1 y 120"),
  isOwnGoal: z.boolean().default(false),
})

export const cardSchema = z.object({
  playerId: z.string().uuid(),
  teamId: z.string().uuid(),
  type: z.enum({ YELLOW: "YELLOW", RED: "RED" }),
  minute: z.coerce.number().int().min(1, "El minuto debe ser entre 1 y 120").max(120, "El minuto debe ser entre 1 y 120"),
})

export const finishMatchSchema = z.object({
  localScore: z.coerce.number().int().min(0, "El resultado debe ser un número positivo"),
  visitorScore: z.coerce.number().int().min(0, "El resultado debe ser un número positivo"),
  goals: z.array(goalSchema).default([]),
  cards: z.array(cardSchema).default([]),
})

export type GoalFormData = z.input<typeof goalSchema>
export type CardFormData = z.input<typeof cardSchema>
export type FinishMatchFormData = z.input<typeof finishMatchSchema>
