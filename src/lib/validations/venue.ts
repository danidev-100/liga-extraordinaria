import { z } from "zod"
export const venueSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100, "El nombre no puede exceder 100 caracteres"),
  address: z.string().max(200, "La dirección no puede exceder 200 caracteres").optional().or(z.literal("")),
  city: z.string().min(2, "La ciudad debe tener al menos 2 caracteres").max(100, "La ciudad no puede exceder 100 caracteres"),
  googleMapsLink: z.string().url("Debe ser una URL válida").max(500, "La URL no puede exceder 500 caracteres").optional().or(z.literal("")),
})
export type VenueFormData = z.input<typeof venueSchema>
export const venueUpdateSchema = venueSchema.partial()
export type VenueUpdateData = z.input<typeof venueUpdateSchema>