"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import db from "@/lib/db"
import { calculateStandings, type TeamInfo, type MatchResultData, type CardData } from "@/lib/standings"

async function ensureAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("No autorizado")
  }
  return session
}

export async function getStandingsByCategory(categoryId: string) {
  await ensureAuth()

  const standings = await db.standing.findMany({
    where: { categoryId },
    include: {
      team: { select: { name: true, shortName: true, logoUrl: true, color: true } },
    },
    orderBy: { position: "asc" },
  })

  return standings
}

export async function recalculateStandings(categoryId: string) {
  await ensureAuth()

  // Fetch all data needed
  const [teams, matches, cards] = await Promise.all([
    db.team.findMany({
      where: { categoryId },
      select: { id: true, name: true, shortName: true, logoUrl: true, color: true },
    }),
    db.match.findMany({
      where: { categoryId, status: "FINISHED" },
      select: {
        localTeamId: true,
        visitorTeamId: true,
        localScore: true,
        visitorScore: true,
      },
    }),
    db.card.findMany({
      where: { match: { categoryId, status: "FINISHED" } },
      select: { teamId: true, type: true },
    }),
  ])

  // Run pure function
  const result = calculateStandings(
    teams as TeamInfo[],
    matches as MatchResultData[],
    cards as CardData[],
  )

  // Delete old standings and create new ones atomically
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.$transaction(async (tx: any) => {
    await tx.standing.deleteMany({ where: { categoryId } })

    if (result.length > 0) {
      await tx.standing.createMany({
        data: result.map((s) => ({
          categoryId,
          teamId: s.teamId,
          pts: s.pts,
          pj: s.pj,
          pg: s.pg,
          pe: s.pe,
          pp: s.pp,
          gf: s.gf,
          gc: s.gc,
          dg: s.dg,
          ta: s.ta,
          tr: s.tr,
          position: s.position,
        })),
      })
    }
  })

  revalidatePath("/admin/standings")
  revalidatePath("/admin/matches")
}

export async function getAllCategories(leagueId?: string) {
  await ensureAuth()

  return db.category.findMany({
    where: leagueId ? { leagueId } : undefined,
    include: { league: { select: { name: true } } },
    orderBy: { name: "asc" },
  })
}

export async function getAllLeagues() {
  await ensureAuth()

  return db.league.findMany({
    orderBy: { name: "asc" },
  })
}
