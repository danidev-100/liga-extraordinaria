"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import db from "@/lib/db"
import { leagueSchema, type LeagueFormData } from "@/lib/validations/league"

async function ensureAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("No autorizado")
  }
  return session
}

export async function getLeagues() {
  await ensureAuth()

  return db.league.findMany({
    orderBy: { createdAt: "desc" },
  })
}

export async function getLeagueById(id: string) {
  await ensureAuth()

  return db.league.findUnique({
    where: { id },
  })
}

export async function createLeague(data: LeagueFormData) {
  await ensureAuth()

  const parsed = leagueSchema.parse(data)

  const league = await db.league.create({
    data: {
      name: parsed.name,
      season: parsed.season,
      startDate: new Date(parsed.startDate),
      endDate: new Date(parsed.endDate),
      isActive: parsed.isActive ?? false,
    },
  })

  revalidatePath("/admin/leagues")
  return league
}

export async function updateLeague(id: string, data: Partial<LeagueFormData>) {
  await ensureAuth()

  const parsed = leagueSchema.partial().parse(data)

  const updateData: Record<string, unknown> = {}
  if (parsed.name !== undefined) updateData.name = parsed.name
  if (parsed.season !== undefined) updateData.season = parsed.season
  if (parsed.startDate !== undefined) updateData.startDate = new Date(parsed.startDate)
  if (parsed.endDate !== undefined) updateData.endDate = new Date(parsed.endDate)
  if (parsed.isActive !== undefined) updateData.isActive = parsed.isActive

  const league = await db.league.update({
    where: { id },
    data: updateData,
  })

  revalidatePath("/admin/leagues")
  return league
}

export async function deleteLeague(id: string) {
  await ensureAuth()

  await db.league.delete({
    where: { id },
  })

  revalidatePath("/admin/leagues")
}

export async function toggleLeagueActive(id: string) {
  await ensureAuth()

  const league = await db.league.findUnique({ where: { id } })
  if (!league) throw new Error("Liga no encontrada")

  if (!league.isActive) {
    // Deactivate all other leagues, then activate this one
    await db.league.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    })
  }

  const updated = await db.league.update({
    where: { id },
    data: { isActive: !league.isActive },
  })

  revalidatePath("/admin/leagues")
  return updated
}
