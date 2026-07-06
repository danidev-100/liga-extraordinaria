"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import db from "@/lib/db"
import { matchSchema, matchUpdateSchema, type MatchFormData, type MatchUpdateData } from "@/lib/validations/match"

async function ensureAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("No autorizado")
  }
  return session
}

export async function getMatches(params?: { categoryId?: string }) {
  await ensureAuth()

  const where: Record<string, unknown> = {}
  if (params?.categoryId) {
    where.categoryId = params.categoryId
  }

  return db.match.findMany({
    where,
    include: {
      category: { select: { name: true } },
      court: { select: { name: true } },
      localTeam: { select: { id: true, name: true, shortName: true } },
      visitorTeam: { select: { id: true, name: true, shortName: true } },
    },
    orderBy: [{ date: "desc" }, { time: "desc" }],
  })
}

export async function getMatchById(id: string) {
  await ensureAuth()

  return db.match.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true } },
      court: { select: { id: true, name: true } },
      localTeam: {
        select: {
          id: true,
          name: true,
          shortName: true,
          players: {
            select: { id: true, name: true, surname: true },
            orderBy: { name: "asc" },
          },
        },
      },
      visitorTeam: {
        select: {
          id: true,
          name: true,
          shortName: true,
          players: {
            select: { id: true, name: true, surname: true },
            orderBy: { name: "asc" },
          },
        },
      },
      goals: {
        include: {
          player: { select: { id: true, name: true, surname: true } },
        },
        orderBy: { minute: "asc" },
      },
      cards: {
        include: {
          player: { select: { id: true, name: true, surname: true } },
        },
        orderBy: { minute: "asc" },
      },
    },
  })
}

export async function getMatchFormData() {
  await ensureAuth()

  const [categories, courts] = await Promise.all([
    db.category.findMany({
      include: {
        league: { select: { name: true } },
        teams: {
          select: { id: true, name: true, shortName: true },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    db.court.findMany({ orderBy: { name: "asc" } }),
  ])

  return { categories, courts }
}

export async function createMatch(data: MatchFormData) {
  await ensureAuth()

  const parsed = matchSchema.parse(data)

  // Validate both teams belong to the same category
  const [localTeam, visitorTeam] = await Promise.all([
    db.team.findUnique({ where: { id: parsed.localTeamId }, select: { categoryId: true } }),
    db.team.findUnique({ where: { id: parsed.visitorTeamId }, select: { categoryId: true } }),
  ])

  if (!localTeam || !visitorTeam) {
    throw new Error("Uno o ambos equipos no existen")
  }

  if (localTeam.categoryId !== parsed.categoryId) {
    throw new Error("El equipo local no pertenece a la categoría seleccionada")
  }

  if (visitorTeam.categoryId !== parsed.categoryId) {
    throw new Error("El equipo visitante no pertenece a la categoría seleccionada")
  }

  // Validate court availability
  const existing = await db.match.findFirst({
    where: {
      courtId: parsed.courtId,
      date: new Date(parsed.date),
      time: parsed.time,
    },
  })

  if (existing) {
    throw new Error("La cancha ya está reservada en esa fecha y hora")
  }

  const match = await db.match.create({
    data: {
      categoryId: parsed.categoryId,
      courtId: parsed.courtId,
      date: new Date(parsed.date),
      time: parsed.time,
      localTeamId: parsed.localTeamId,
      visitorTeamId: parsed.visitorTeamId,
      round: parsed.round,
    },
  })

  revalidatePath("/admin/matches")
  return match
}

export async function updateMatch(id: string, data: MatchUpdateData) {
  await ensureAuth()

  const parsed = matchUpdateSchema.parse(data)

  // If changing teams, validate same-team guard
  if (parsed.localTeamId && parsed.visitorTeamId && parsed.localTeamId === parsed.visitorTeamId) {
    throw new Error("El equipo local y visitante deben ser diferentes")
  }

  // If changing court/date/time, check availability
  if ((parsed.courtId || parsed.date || parsed.time)) {
    const current = await db.match.findUnique({ where: { id }, select: { courtId: true, date: true, time: true } })
    if (current) {
      const checkCourt = parsed.courtId ?? current.courtId
      const checkDate = parsed.date ? new Date(parsed.date) : current.date
      const checkTime = parsed.time ?? current.time

      const existing = await db.match.findFirst({
        where: {
          courtId: checkCourt,
          date: checkDate,
          time: checkTime,
          id: { not: id },
        },
      })

      if (existing) {
        throw new Error("La cancha ya está reservada en esa fecha y hora")
      }
    }
  }

  const updateData: Record<string, unknown> = {}
  if (parsed.categoryId !== undefined) updateData.categoryId = parsed.categoryId
  if (parsed.courtId !== undefined) updateData.courtId = parsed.courtId
  if (parsed.date !== undefined) updateData.date = new Date(parsed.date)
  if (parsed.time !== undefined) updateData.time = parsed.time
  if (parsed.localTeamId !== undefined) updateData.localTeamId = parsed.localTeamId
  if (parsed.visitorTeamId !== undefined) updateData.visitorTeamId = parsed.visitorTeamId
  if (parsed.round !== undefined) updateData.round = parsed.round

  const match = await db.match.update({
    where: { id },
    data: updateData,
  })

  revalidatePath("/admin/matches")
  return match
}

export async function clearFinishedMatches() {
  await ensureAuth()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deleted = await db.$transaction(async (tx: any) => {
    // Delete goals and cards from finished matches first (cascade should handle it, but be explicit)
    const finishedMatches: { id: string }[] = await tx.match.findMany({
      where: { status: "FINISHED" },
      select: { id: true },
    })

    if (finishedMatches.length === 0) return 0

    const matchIds = finishedMatches.map((m) => m.id)

    await tx.goal.deleteMany({ where: { matchId: { in: matchIds } } })
    await tx.card.deleteMany({ where: { matchId: { in: matchIds } } })
    await tx.match.deleteMany({ where: { id: { in: matchIds } } })

    return finishedMatches.length
  })

  revalidatePath("/admin/matches")
  revalidatePath("/admin/standings")
  return { count: deleted }
}

export async function deleteMatch(id: string) {
  await ensureAuth()

  const match = await db.match.findUnique({
    where: { id },
    select: { status: true },
  })

  if (!match) throw new Error("Partido no encontrado")
  if (match.status !== "SCHEDULED") {
    throw new Error("Solo se pueden eliminar partidos programados")
  }

  await db.match.delete({ where: { id } })

  revalidatePath("/admin/matches")
}

/**
 * Generate a full round-robin season for a category.
 * Every team plays every other team once (single round-robin).
 * For N teams → N-1 rounds, each round has N/2 matches.
 * Rounds are spaced 7 days apart from startDate.
 * Matches within a round get staggered times and cycle through courts.
 */
export async function generateRoundRobin(data: {
  categoryId: string
  startDate: string
  baseTime: string
}) {
  await ensureAuth()

  const { categoryId, startDate, baseTime } = data

  // Fetch teams
  const teams: { id: string; name: string }[] = await db.team.findMany({
    where: { categoryId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  if (teams.length < 3) {
    throw new Error("Se necesitan al menos 3 equipos para generar un fixture round-robin")
  }

  // Check if category already has matches
  const existingCount = await db.match.count({ where: { categoryId } })
  if (existingCount > 0) {
    throw new Error(
      `Ya hay ${existingCount} partido(s) en esta categoría. Borralos primero o usá otra categoría.`,
    )
  }

  // Fetch available courts
  const courts = await db.court.findMany({ orderBy: { name: "asc" } })
  if (courts.length === 0) {
    throw new Error("No hay canchas registradas. Creá al menos una cancha primero.")
  }

  const n = teams.length
  const rounds = n % 2 === 0 ? n - 1 : n
  const matchesPerRound = Math.floor(n / 2)

  // ── Round-robin schedule using the circle method ──
  // Fix the first team, rotate the rest each round
  const teamIds = teams.map((t) => t.id)
  const isEven = n % 2 === 0
  const circle = isEven ? [...teamIds] : [...teamIds, "BYE" as const]
  const totalSlots = circle.length // n or n+1

  interface RoundPair {
    localTeamId: string
    visitorTeamId: string
  }

  const allRounds: RoundPair[][] = []

  for (let r = 0; r < rounds; r++) {
    const pairs: RoundPair[] = []

    for (let i = 0; i < totalSlots / 2; i++) {
      const home = circle[i]
      const away = circle[totalSlots - 1 - i]

      if (home === "BYE" || away === "BYE") continue

      // Alternate home/away each round so it's fairer
      const pair = r % 2 === 0
        ? { localTeamId: home, visitorTeamId: away }
        : { localTeamId: away, visitorTeamId: home }

      pairs.push(pair)
    }

    allRounds.push(pairs)

    // Rotate: keep first element fixed, rotate the rest clockwise
    if (totalSlots > 1) {
      const fixed = circle[0]
      const rest = circle.slice(1)
      const rotated = [rest[rest.length - 1], ...rest.slice(0, -1)]
      circle[0] = fixed
      for (let i = 0; i < rotated.length; i++) {
        circle[i + 1] = rotated[i]
      }
    }
  }

  // ── Assign dates, times, and courts ──
  const baseDate = new Date(startDate)
  const staggerMinutes = 120 // 2 hours between matches in the same round

  type MatchInsert = {
    categoryId: string
    courtId: string
    date: Date
    time: string
    localTeamId: string
    visitorTeamId: string
    round: number
    status: "SCHEDULED"
  }

  const inserts: MatchInsert[] = []

  for (let r = 0; r < allRounds.length; r++) {
    const roundDate = new Date(baseDate)
    roundDate.setDate(roundDate.getDate() + r * 7) // each round +1 week

    const pairs = allRounds[r]

    for (let m = 0; m < pairs.length; m++) {
      const court = courts[m % courts.length]

      // Calculate staggered time
      const [baseH, baseM] = baseTime.split(":").map(Number)
      const totalMinutes = baseH * 60 + baseM + m * staggerMinutes
      const h = Math.floor(totalMinutes / 60) % 24
      const min = totalMinutes % 60
      const time = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`

      inserts.push({
        categoryId,
        courtId: court.id,
        date: roundDate,
        time,
        localTeamId: pairs[m].localTeamId,
        visitorTeamId: pairs[m].visitorTeamId,
        round: r + 1,
        status: "SCHEDULED",
      })
    }
  }

  await db.match.createMany({ data: inserts })

  revalidatePath("/admin/matches")
  return {
    totalMatches: inserts.length,
    totalRounds: allRounds.length,
    teamsCount: n,
  }
}
