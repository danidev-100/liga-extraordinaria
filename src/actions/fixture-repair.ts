"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { ensureScope } from "@/lib/ensure-scope"
import db from "@/lib/db"
import { findDuplicateEncounters, type EncounterMatch } from "@/lib/matches/encounter"
import { repairFixture } from "@/lib/matches/fixture-repair"

async function ensureAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("No autorizado")
  }
  return session
}

export interface RepairCategoryResult {
  fixed: number
}

/**
 * Detect pre-existing duplicate encounters in a category and re-arrange the
 * remaining (non-frozen) fixture so every pair of teams meets only once.
 *
 * Frozen matches (rounds before the first duplicate, and any FINISHED/PLAYING
 * match) are never changed. The repair is simulated in memory first and only
 * committed when the resulting fixture has no duplicates left.
 */
export async function repairCategoryMatches(categoryId: string, slug?: string) {
  await ensureAuth()
  if (slug) await ensureScope(slug)

  const matches = await db.match.findMany({
    where: { categoryId },
    select: { id: true, round: true, localTeamId: true, visitorTeamId: true, status: true },
    orderBy: [{ round: "asc" }],
  })

  const teams = await db.team.findMany({ where: { categoryId }, select: { id: true } })

  const duplicates = findDuplicateEncounters(
    matches.map((m) => ({
      id: m.id,
      round: m.round,
      localTeamId: m.localTeamId,
      visitorTeamId: m.visitorTeamId,
    })),
  )

  if (duplicates.length === 0) {
    return { fixed: 0 }
  }

  // Anchor the repair on the duplicate match in the lowest round: its encounter
  // stays put and the solver re-arranges everything from that round onward,
  // which removes every duplicate in the process (used pairs are never reused).
  const earliest = duplicates[0]
  const anchor = matches.find((m) => m.id === earliest.matchIds[0])
  if (!anchor) return { fixed: 0 }

  const result = repairFixture({
    teams: teams.map((t) => t.id),
    matches: matches.map((m) => ({
      id: m.id,
      round: m.round,
      localTeamId: m.localTeamId,
      visitorTeamId: m.visitorTeamId,
      frozen: m.round < anchor.round || m.status === "FINISHED" || m.status === "PLAYING",
    })),
    editedMatchId: anchor.id,
    newLocalTeamId: anchor.localTeamId,
    newVisitorTeamId: anchor.visitorTeamId,
  })

  if (!result.ok) {
    if (result.reason === "frozen-conflict") {
      throw new Error(
        "Hay un cruce repetido que involucra un partido ya jugado; no se puede reparar automáticamente.",
      )
    }
    throw new Error("No pudimos reacomodar el fixture sin repetir cruces. Corregilo manualmente.")
  }

  // Simulate the repair in memory and re-check for leftovers.
  const changeMap = new Map(result.changes.map((c) => [c.matchId, c]))
  const simulated: EncounterMatch[] = matches.map((m) => {
    const change = changeMap.get(m.id)
    return {
      id: m.id,
      round: m.round,
      localTeamId: change ? change.localTeamId : m.localTeamId,
      visitorTeamId: change ? change.visitorTeamId : m.visitorTeamId,
    }
  })

  const remaining = findDuplicateEncounters(simulated)
  if (remaining.length > 0) {
    throw new Error(
      "Quedan cruces repetidos que involucran partidos ya jugados; no se pueden reparar automáticamente.",
    )
  }

  // Commit atomically.
  if (result.changes.length > 0) {
    await db.$transaction(
      result.changes.map((c) =>
        db.match.update({
          where: { id: c.matchId },
          data: { localTeamId: c.localTeamId, visitorTeamId: c.visitorTeamId },
        }),
      ),
    )
  }

  revalidatePath("/admin/matches")
  revalidatePath("/admin/standings")
  if (slug) {
    revalidatePath(`/admin/ligas/${slug}/matches`)
  }

  return { fixed: result.changes.length } satisfies RepairCategoryResult
}