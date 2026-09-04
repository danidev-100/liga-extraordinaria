"use server"

/**
 * Venues are intentionally GLOBAL — shared across all leagues.
 * They represent physical locations that multiple leagues can use.
 * No league scoping is needed for this module.
 */

import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import db from "@/lib/db"
import { venueSchema, type VenueFormData } from "@/lib/validations/venue"

async function ensureAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("No autorizado")
  }
  return session
}

export async function getVenues() {
  await ensureAuth()

  return db.venue.findMany({
    include: { _count: { select: { courts: true } } },
    orderBy: { name: "asc" },
  })
}

export async function getVenueById(id: string) {
  await ensureAuth()

  return db.venue.findUnique({
    where: { id },
    include: { courts: { orderBy: { name: "asc" } } },
  })
}

export async function createVenue(data: VenueFormData) {
  await ensureAuth()

  const parsed = venueSchema.parse(data)

  const venue = await db.venue.create({
    data: {
      name: parsed.name,
      address: parsed.address || null,
      city: parsed.city,
      googleMapsLink: parsed.googleMapsLink || null,
    },
  })

  revalidatePath("/admin/courts")
  return venue
}

export async function updateVenue(id: string, data: Partial<VenueFormData>) {
  await ensureAuth()

  const parsed = venueSchema.partial().parse(data)

  const updateData: Record<string, unknown> = {}
  if (parsed.name !== undefined) updateData.name = parsed.name
  if (parsed.address !== undefined) updateData.address = parsed.address || null
  if (parsed.city !== undefined) updateData.city = parsed.city
  if (parsed.googleMapsLink !== undefined) updateData.googleMapsLink = parsed.googleMapsLink || null

  const venue = await db.venue.update({
    where: { id },
    data: updateData,
  })

  revalidatePath("/admin/courts")
  return venue
}

export async function deleteVenue(id: string) {
  await ensureAuth()

  try {
    await db.venue.delete({
      where: { id },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      throw new Error("No se puede eliminar un lugar con canchas en uso por partidos")
    }
    throw error
  }

  revalidatePath("/admin/courts")
}