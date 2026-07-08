"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { ensureScope } from "@/lib/ensure-scope"
import db from "@/lib/db"
import { playerSchema, type PlayerFormData } from "@/lib/validations/player"

async function ensureAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("No autorizado")
  }
  return session
}

export async function getPlayers(leagueId?: string) {
  await ensureAuth()

  return db.player.findMany({
    where: leagueId ? { team: { category: { leagueId } } } : undefined,
    include: {
      team: {
        select: {
          name: true,
          shortName: true,
          category: { select: { name: true } },
        },
      },
    },
    orderBy: [{ surname: "asc" }, { name: "asc" }],
  })
}

export async function getPlayerById(id: string) {
  await ensureAuth()

  return db.player.findUnique({
    where: { id },
    include: {
      team: {
        select: { name: true, shortName: true, categoryId: true },
      },
    },
  })
}

export async function createPlayer(data: PlayerFormData, slug?: string) {
  await ensureAuth()
  if (slug) await ensureScope(slug)

  const parsed = playerSchema.parse(data)

  const player = await db.player.create({
    data: {
      name: parsed.name,
      surname: parsed.surname,
      dni: parsed.dni,
      birthDate: new Date(parsed.birthDate),
      jerseyNumber: parsed.jerseyNumber ?? null,
      teamId: parsed.teamId,
      isActive: parsed.isActive ?? true,
    },
  })

  revalidatePath("/admin/players")
  return player
}

export async function updatePlayer(id: string, data: Partial<PlayerFormData>, slug?: string) {
  await ensureAuth()
  if (slug) await ensureScope(slug)

  const parsed = playerSchema.partial().parse(data)

  const updateData: Record<string, unknown> = {}
  if (parsed.name !== undefined) updateData.name = parsed.name
  if (parsed.surname !== undefined) updateData.surname = parsed.surname
  if (parsed.dni !== undefined) updateData.dni = parsed.dni
  if (parsed.birthDate !== undefined) updateData.birthDate = new Date(parsed.birthDate)
  if (parsed.jerseyNumber !== undefined) updateData.jerseyNumber = parsed.jerseyNumber
  if (parsed.teamId !== undefined) updateData.teamId = parsed.teamId
  if (parsed.isActive !== undefined) updateData.isActive = parsed.isActive

  const player = await db.player.update({
    where: { id },
    data: updateData,
  })

  revalidatePath("/admin/players")
  return player
}

export async function deletePlayer(id: string, slug?: string) {
  await ensureAuth()
  if (slug) await ensureScope(slug)

  await db.player.delete({
    where: { id },
  })

  revalidatePath("/admin/players")
}
