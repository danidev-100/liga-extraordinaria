"use server"

/**
 * Courts belong to a Venue (Lugar) and are GLOBAL — shared across all leagues.
 * Each court represents one specific cancha (e.g. "Cancha 1") inside a venue.
 */

import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import db from "@/lib/db"
import { courtSchema, type CourtFormData } from "@/lib/validations/court"

async function ensureAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("No autorizado")
  }
  return session
}

export async function getCourts() {
  await ensureAuth()

  return db.court.findMany({
    include: { venue: { select: { name: true } } },
    orderBy: { name: "asc" },
  })
}

export async function getCourtById(id: string) {
  await ensureAuth()

  return db.court.findUnique({
    where: { id },
    include: { venue: { select: { name: true } } },
  })
}

export async function createCourt(data: CourtFormData) {
  await ensureAuth()

  const parsed = courtSchema.parse(data)

  const court = await db.court.create({
    data: {
      name: parsed.name,
      venueId: parsed.venueId,
      capacity: parsed.capacity ?? null,
    },
  })

  revalidatePath("/admin/courts")
  return court
}

export async function updateCourt(id: string, data: Partial<CourtFormData>) {
  await ensureAuth()

  const parsed = courtSchema.partial().parse(data)

  const updateData: Record<string, unknown> = {}
  if (parsed.name !== undefined) updateData.name = parsed.name
  if (parsed.venueId !== undefined) updateData.venueId = parsed.venueId
  if (parsed.capacity !== undefined) updateData.capacity = parsed.capacity ?? null

  const court = await db.court.update({
    where: { id },
    data: updateData,
  })

  revalidatePath("/admin/courts")
  return court
}

export async function deleteCourt(id: string) {
  await ensureAuth()

  try {
    await db.court.delete({
      where: { id },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      throw new Error("No se puede eliminar una cancha en uso por partidos")
    }
    throw error
  }

  revalidatePath("/admin/courts")
}