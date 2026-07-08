"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { ensureScope } from "@/lib/ensure-scope"
import db from "@/lib/db"
import { finishMatchSchema, type FinishMatchFormData } from "@/lib/validations/match-result"
import { calculateStandings, type TeamInfo, type MatchResultData, type CardData } from "@/lib/standings"

async function ensureAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("No autorizado")
  }
  return session
}

/**
 * Process cards before saving: if a player has 2+ yellows in the same match,
 * auto-convert the last one (by minute) to RED.
 * Two yellows = red card in football.
 */
function processCards(
  cards: ({ playerId: string; teamId: string; minute: number; type: "YELLOW" | "RED" })[] | undefined,
  matchId: string,
): { matchId: string; playerId: string; teamId: string; type: "YELLOW" | "RED"; minute: number; isSecondYellow: boolean }[] {
  const safeCards = cards ?? []
  // Collect yellows per player with their original index + minute
  const yellowEntries: Map<string, { idx: number; minute: number }[]> = new Map()
  safeCards.forEach((c, idx) => {
    if (c.type === "YELLOW") {
      const entries = yellowEntries.get(c.playerId) ?? []
      entries.push({ idx, minute: c.minute })
      yellowEntries.set(c.playerId, entries)
    }
  })

  // For each player with 2+ yellows, mark the last one (chronologically) for conversion
  const convertIndexes = new Set<number>()
  for (const [, entries] of yellowEntries) {
    if (entries.length >= 2) {
      // Sort by minute, then by original index for stability
      entries.sort((a, b) => a.minute - b.minute || a.idx - b.idx)
      convertIndexes.add(entries[entries.length - 1].idx)
    }
  }

  return safeCards.map((c, idx) => {
    const isSecondYellow = c.type === "YELLOW" && convertIndexes.has(idx)
    return {
      matchId,
      playerId: c.playerId,
      teamId: c.teamId,
      type: isSecondYellow ? "RED" : c.type,
      minute: c.minute,
      isSecondYellow,
    }
  })
}

export async function finishMatch(matchId: string, data: FinishMatchFormData, slug?: string) {
  await ensureAuth()
  if (slug) await ensureScope(slug)

  const parsed = finishMatchSchema.parse(data)

  const match = await db.match.findUnique({
    where: { id: matchId },
    select: { id: true, status: true, categoryId: true },
  })

  if (!match) throw new Error("Partido no encontrado")

  // Execute everything atomically
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.$transaction(async (tx: any) => {
    // 1. Update match scores and status
    await tx.match.update({
      where: { id: matchId },
      data: {
        localScore: parsed.localScore,
        visitorScore: parsed.visitorScore,
        status: "FINISHED",
      },
    })

    // 2. Delete existing goals/cards for this match (in case of re-run)
    await tx.goal.deleteMany({ where: { matchId } })
    await tx.card.deleteMany({ where: { matchId } })

    // 3. Create goals
    if (parsed.goals.length > 0) {
      await tx.goal.createMany({
        data: parsed.goals.map((g) => ({
          matchId,
          playerId: g.playerId,
          teamId: g.teamId,
          minute: g.minute,
          isOwnGoal: g.isOwnGoal ?? false,
        })),
      })
    }

    // 4. Create cards — auto-convert 2nd yellow to RED for same player
    if (parsed.cards.length > 0) {
      const cardData = processCards(parsed.cards, matchId)
      await tx.card.createMany({
        data: cardData.map((c) => ({
          matchId: c.matchId,
          playerId: c.playerId,
          teamId: c.teamId,
          type: c.type,
          minute: c.minute,
          isSecondYellow: c.isSecondYellow,
        })),
      })
    }

    // 5. Recalculate standings for the category
    const categoryId = match.categoryId

    const [teams, matches, cards] = await Promise.all([
      tx.team.findMany({
        where: { categoryId },
        select: { id: true, name: true, shortName: true },
      }),
      tx.match.findMany({
        where: { categoryId, status: "FINISHED" },
        select: {
          localTeamId: true,
          visitorTeamId: true,
          localScore: true,
          visitorScore: true,
        },
      }),
      tx.card.findMany({
        where: { match: { categoryId, status: "FINISHED" } },
        select: { teamId: true, type: true },
      }),
    ])

    const result = calculateStandings(
      teams as TeamInfo[],
      matches as MatchResultData[],
      cards as CardData[],
    )

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

  revalidatePath("/admin/matches")
  revalidatePath("/admin/standings")
}
