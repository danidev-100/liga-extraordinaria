"use server"

/**
 * Courts are intentionally GLOBAL — shared across all leagues.
 * They represent physical venues that multiple leagues can use.
 * No league scoping is needed for this module.
 */

import { revalidatePath } from "next/cache"
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
    orderBy: { name: "asc" },
  })
}

export async function getCourtById(id: string) {
  await ensureAuth()

  return db.court.findUnique({
    where: { id },
  })
}

export async function createCourt(data: CourtFormData) {
  await ensureAuth()

  const parsed = courtSchema.parse(data)

  const court = await db.court.create({
    data: {
      name: parsed.name,
      address: parsed.address || null,
      city: parsed.city,
      capacity: parsed.capacity ?? null,
      googleMapsLink: parsed.googleMapsLink || null,
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
  if (parsed.address !== undefined) updateData.address = parsed.address || null
  if (parsed.city !== undefined) updateData.city = parsed.city
  if (parsed.capacity !== undefined) updateData.capacity = parsed.capacity ?? null
  if (parsed.googleMapsLink !== undefined) updateData.googleMapsLink = parsed.googleMapsLink || null

  const court = await db.court.update({
    where: { id },
    data: updateData,
  })

  revalidatePath("/admin/courts")
  return court
}

export async function deleteCourt(id: string) {
  await ensureAuth()

  await db.court.delete({
    where: { id },
  })

  revalidatePath("/admin/courts")
}
