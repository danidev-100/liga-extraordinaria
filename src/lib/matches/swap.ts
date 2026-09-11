/**
 * Manual opponent swap between two matches of the same round.
 *
 * There is no home/away in this league: an encounter is the unordered pair of
 * teams. Swapping rivals between `A vs B` and `C vs D` exchanges the visitors
 * and produces `A vs D` and `C vs B`. Every team in the round keeps playing
 * exactly once, and only the two selected matches are ever touched.
 *
 * In a complete round-robin every possible encounter already exists somewhere
 * in the fixture, so a swap almost always repeats a crossing from another
 * round. Instead of blocking the swap (which makes the feature useless), the
 * repeated crossings are reported as `warnings` and the caller decides whether
 * to apply it anyway.
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

export interface SwapWarning {
  round: number
  localTeamId: string
  visitorTeamId: string
}

export type SwapResult =
  | { ok: true; changes: SwapChange[]; warnings: SwapWarning[] }
  | { ok: false; reason: "different-round" | "same-team" }

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

/**
 * Computes the visitor swap between `a` and `b` and reports any resulting
 * encounter that already exists elsewhere in the category as a warning.
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

  const warnings: SwapWarning[] = []
  const excluded = new Set([a.id, b.id])
  for (const m of allMatches) {
    if (excluded.has(m.id)) continue
    const key = pairKey(m.localTeamId, m.visitorTeamId)
    if (key === pairKey(changeA.localTeamId, changeA.visitorTeamId)) {
      warnings.push({
        round: m.round,
        localTeamId: changeA.localTeamId,
        visitorTeamId: changeA.visitorTeamId,
      })
    }
    if (key === pairKey(changeB.localTeamId, changeB.visitorTeamId)) {
      warnings.push({
        round: m.round,
        localTeamId: changeB.localTeamId,
        visitorTeamId: changeB.visitorTeamId,
      })
    }
  }

  return { ok: true, changes: [changeA, changeB], warnings }
}