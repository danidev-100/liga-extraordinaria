/**
 * Manual opponent swap between two matches of the same round.
 *
 * There is no home/away in this league: an encounter is the unordered pair of
 * teams. Swapping rivals between `A vs B` and `C vs D` exchanges the visitors
 * and produces `A vs D` and `C vs B`. Every team in the round keeps playing
 * exactly once, and only the two selected matches are ever touched.
 */

export interface SwapMatch {
  id: string
  round: number
  localTeamId: string
  visitorTeamId: string
}

export interface SwapChange {
  matchId: string
  localTeamId: string
  visitorTeamId: string
}

export type SwapResult =
  | { ok: true; changes: SwapChange[] }
  | { ok: false; reason: "different-round" | "same-team" }
  | {
      ok: false
      reason: "duplicate"
      round: number
      localTeamId: string
      visitorTeamId: string
    }

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

/**
 * Computes the visitor swap between `a` and `b` and validates that neither of
 * the two resulting encounters already exists elsewhere in the category.
 */
export function swapRivals(
  a: SwapMatch,
  b: SwapMatch,
  allMatches: SwapMatch[],
): SwapResult {
  if (a.round !== b.round) return { ok: false, reason: "different-round" }

  const changeA: SwapChange = {
    matchId: a.id,
    localTeamId: a.localTeamId,
    visitorTeamId: b.visitorTeamId,
  }
  const changeB: SwapChange = {
    matchId: b.id,
    localTeamId: b.localTeamId,
    visitorTeamId: a.visitorTeamId,
  }

  if (changeA.localTeamId === changeA.visitorTeamId || changeB.localTeamId === changeB.visitorTeamId) {
    return { ok: false, reason: "same-team" }
  }

  const excluded = new Set([a.id, b.id])
  for (const m of allMatches) {
    if (excluded.has(m.id)) continue
    const key = pairKey(m.localTeamId, m.visitorTeamId)
    if (key === pairKey(changeA.localTeamId, changeA.visitorTeamId)) {
      return {
        ok: false,
        reason: "duplicate",
        round: m.round,
        localTeamId: changeA.localTeamId,
        visitorTeamId: changeA.visitorTeamId,
      }
    }
    if (key === pairKey(changeB.localTeamId, changeB.visitorTeamId)) {
      return {
        ok: false,
        reason: "duplicate",
        round: m.round,
        localTeamId: changeB.localTeamId,
        visitorTeamId: changeB.visitorTeamId,
      }
    }
  }

  return { ok: true, changes: [changeA, changeB] }
}