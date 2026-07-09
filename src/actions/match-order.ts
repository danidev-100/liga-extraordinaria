"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import db from "@/lib/db"

export async function updateMatchDateTime(
  matchId: string,
  data: { date?: string; time?: string; round?: number },
  slug?: string,
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")

  const updateData: Record<string, unknown> = {}
  if (data.date) updateData.date = new Date(data.date)
  if (data.time) updateData.time = data.time
  if (data.round !== undefined) updateData.round = data.round

  if (Object.keys(updateData).length === 0) return

  // If changing time, check court availability
  const current = await db.match.findUnique({
    where: { id: matchId },
    select: { courtId: true, date: true, time: true },
  })
  if (!current) throw new Error("Partido no encontrado")

  const checkDate = data.date ? new Date(data.date) : current.date
  const checkTime = data.time ?? current.time

  const existing = await db.match.findFirst({
    where: {
      courtId: current.courtId,
      date: checkDate,
      time: checkTime,
      id: { not: matchId },
    },
  })

  if (existing) {
    throw new Error("La cancha ya está reservada en esa fecha y hora")
  }

  await db.match.update({
    where: { id: matchId },
    data: updateData,
  })

  revalidatePath("/admin/matches")
}

export async function bulkUpdateMatches(
  updates: { id: string; date?: string; time?: string; round?: number }[],
  slug?: string,
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")

  const results = { ok: 0, errors: 0 }

  for (const update of updates) {
    try {
      const updateData: Record<string, unknown> = {}
      if (update.date) updateData.date = new Date(update.date)
      if (update.time) updateData.time = update.time
      if (update.round !== undefined) updateData.round = update.round

      if (Object.keys(updateData).length === 0) continue

      await db.match.update({
        where: { id: update.id },
        data: updateData,
      })
      results.ok++
    } catch {
      results.errors++
    }
  }

  revalidatePath("/admin/matches")
  return results
}

export async function getMatchesByRound(categoryId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")

  const matches = await db.match.findMany({
    where: { categoryId },
    include: {
      court: { select: { id: true, name: true } },
      localTeam: { select: { id: true, name: true, shortName: true } },
      visitorTeam: { select: { id: true, name: true, shortName: true } },
    },
    orderBy: [{ round: "asc" }, { date: "asc" }, { time: "asc" }],
  })

  const grouped = matches.reduce(
    (acc, m) => {
      const r = m.round
      if (!acc[r]) acc[r] = []
      acc[r].push(m)
      return acc
    },
    {} as Record<number, typeof matches>,
  )

  const rounds = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b)

  return { rounds: rounds.map((r) => ({ round: r, matches: grouped[r] })) }
}

export async function swapMatchRound(matchId1: string, matchId2: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")

  const [match1, match2] = await Promise.all([
    db.match.findUnique({ where: { id: matchId1 }, select: { round: true } }),
    db.match.findUnique({ where: { id: matchId2 }, select: { round: true } }),
  ])

  if (!match1 || !match2) throw new Error("Uno o ambos partidos no encontrados")

  await db.$transaction([
    db.match.update({ where: { id: matchId1 }, data: { round: match2.round } }),
    db.match.update({ where: { id: matchId2 }, data: { round: match1.round } }),
  ])

  revalidatePath("/admin/matches")
}
