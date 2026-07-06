"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import db from "@/lib/db"
import { teamSchema, type TeamFormData } from "@/lib/validations/team"

async function ensureAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("No autorizado")
  }
  return session
}

export async function getTeams() {
  await ensureAuth()

  return db.team.findMany({
    include: {
      category: {
        select: { name: true, league: { select: { name: true } } },
      },
      _count: { select: { players: true } },
    },
    orderBy: { name: "asc" },
  })
}

export async function getTeamById(id: string) {
  await ensureAuth()

  return db.team.findUnique({
    where: { id },
    include: {
      category: {
        select: { name: true, league: { select: { name: true } } },
      },
      _count: { select: { players: true } },
    },
  })
}

export async function createTeam(data: TeamFormData) {
  await ensureAuth()

  const parsed = teamSchema.parse(data)

  const team = await db.team.create({
    data: {
      name: parsed.name,
      shortName: parsed.shortName,
      color: parsed.color || null,
      categoryId: parsed.categoryId,
    },
  })

  revalidatePath("/admin/teams")
  return team
}

export async function updateTeam(id: string, data: Partial<TeamFormData>) {
  await ensureAuth()

  const parsed = teamSchema.partial().parse(data)

  const updateData: Record<string, unknown> = {}
  if (parsed.name !== undefined) updateData.name = parsed.name
  if (parsed.shortName !== undefined) updateData.shortName = parsed.shortName
  if (parsed.color !== undefined) updateData.color = parsed.color || null
  if (parsed.categoryId !== undefined) updateData.categoryId = parsed.categoryId

  const team = await db.team.update({
    where: { id },
    data: updateData,
  })

  revalidatePath("/admin/teams")
  return team
}

export async function deleteTeam(id: string) {
  await ensureAuth()

  await db.team.delete({
    where: { id },
  })

  revalidatePath("/admin/teams")
}
