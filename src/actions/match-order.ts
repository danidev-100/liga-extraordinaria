"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { ensureScope } from "@/lib/ensure-scope"
import db from "@/lib/db"
import { swapRivals } from "@/lib/matches/swap"

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
      court: { select: { id: true, name: true, venue: { select: { name: true } } } },
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

/**
 * Intercambia los rivales (visitantes) entre dos partidos de la misma jornada.
 * Solo toca esos dos partidos y valida que ningún cruce resultante se repita
 * en el resto del fixture.
 */
export async function swapMatchTeams(matchIdA: string, matchIdB: string, slug?: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")
  if (slug) await ensureScope(slug)

  const [a, b] = await Promise.all([
    db.match.findUnique({
      where: { id: matchIdA },
      select: { id: true, categoryId: true, round: true, status: true, localTeamId: true, visitorTeamId: true },
    }),
    db.match.findUnique({
      where: { id: matchIdB },
      select: { id: true, categoryId: true, round: true, status: true, localTeamId: true, visitorTeamId: true },
    }),
  ])

  if (!a || !b) throw new Error("Uno o ambos partidos no existen")
  if (a.categoryId !== b.categoryId) throw new Error("Los partidos deben ser de la misma categoría")
  if (a.round !== b.round) throw new Error("Los partidos deben ser de la misma jornada")

  const swappable = (status: string) => status === "SCHEDULED" || status === "POSTPONED"
  if (!swappable(a.status) || !swappable(b.status)) {
    throw new Error("No se pueden intercambiar rivales de partidos jugados o en juego")
  }

  const categoryMatches = await db.match.findMany({
    where: { categoryId: a.categoryId },
    select: { id: true, round: true, localTeamId: true, visitorTeamId: true },
  })

  const result = swapRivals(a, b, categoryMatches)

  if (!result.ok) {
    if (result.reason === "different-round") {
      throw new Error("Los partidos deben ser de la misma jornada")
    }
    throw new Error("Un equipo quedaría jugando contra sí mismo")
  }

  await db.$transaction([
    db.match.update({
      where: { id: a.id },
      data: { localTeamId: result.changes[0].localTeamId, visitorTeamId: result.changes[0].visitorTeamId },
    }),
    db.match.update({
      where: { id: b.id },
      data: { localTeamId: result.changes[1].localTeamId, visitorTeamId: result.changes[1].visitorTeamId },
    }),
  ])

  revalidatePath("/admin/matches")
  if (slug) revalidatePath(`/admin/ligas/${slug}/matches`)

  if (result.warnings.length > 0) {
    const teamIds = Array.from(new Set(result.warnings.flatMap((w) => [w.localTeamId, w.visitorTeamId])))
    const teams = await db.team.findMany({ where: { id: { in: teamIds } }, select: { id: true, name: true } })
    const nameMap = Object.fromEntries(teams.map((t) => [t.id, t.name]))
    const warningText = result.warnings
      .map((w) => `${nameMap[w.localTeamId] ?? "?"} vs ${nameMap[w.visitorTeamId] ?? "?"} (Jornada ${w.round})`)
      .join(" · ")
    return { applied: true, warnings: warningText }
  }

  return { applied: true, warnings: null }
}
