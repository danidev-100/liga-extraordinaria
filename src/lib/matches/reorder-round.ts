/**
 * Whole-round reordering for round-robin categories.
 *
 * Invoked explicitly by the admin AFTER they finish editing every encounter
 * they want inside a round (see "Reordenar jornada").
 *
 * The solver re-pairs the edited round AND every later round so that:
 *  - rounds strictly before the edited one are frozen (already played/decided),
 *  - matches already played (FINISHED/PLAYING) are frozen anywhere,
 *  - the edited round's crossings are kept whenever possible (the admin chose
 *    them), but the solver may re-pair it to fix internal inconsistencies
 *    (e.g. a team playing twice in the same round),
 *  - every team plays exactly once per round, or rests (BYE) when the round
 *    has fewer slots than teams (a team may rest only if the admin left it
 *    without a match in the edited round).
 *
 * The search is a bounded backtracking over perfect matchings that keeps the
 * original pairing whenever possible to minimise churn.
 */

/** Sentinel vertex used to represent a resting ("libre") team. */
export const BYE = "__BYE__"

export interface ReorderMatch {
  id: string
  round: number
  localTeamId: string
  visitorTeamId: string
  frozen: boolean
}

export interface ReorderInput {
  /** Team ids that belong to the category. */
  teams: string[]
  /** Every match of the category. */
  matches: ReorderMatch[]
  /** The round the admin just edited; re-solved from here onward. */
  fixedRound: number
}

export interface ReorderChange {
  matchId: string
  localTeamId: string
  visitorTeamId: string
}

export type ReorderResult =
  | { ok: true; changes: ReorderChange[] }
  | { ok: false; reason: "no-solution" }

const MAX_STEPS = 500_000

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

/**
 * Re-solves the edited round and every later round, keeping rounds before it
 * and any FINISHED/PLAYING match untouched. Returns the minimal set of match
 * changes that produces a fixture with no repeated encounters.
 */
export function reorderRoundFixture(input: ReorderInput): ReorderResult {
  const { teams, matches, fixedRound } = input

  const maxRound = matches.reduce((max, m) => Math.max(max, m.round), fixedRound)

  // ── Frozen pairs (cannot be changed) ──
  // Rounds at or before the edited one + FINISHED/PLAYING anywhere.
  const frozenPairs = new Map<string, number>()
  for (const m of matches) {
    if (m.round <= fixedRound || m.frozen) {
      const key = pairKey(m.localTeamId, m.visitorTeamId)
      if (!frozenPairs.has(key)) frozenPairs.set(key, m.round)
    }
  }

  // ── Vertices ──
  const vertices = teams.length % 2 !== 0 ? [...teams, BYE] : [...teams]

  const used = new Set<string>(frozenPairs.keys())

  // Original opponents, used to prefer keeping the current pairing.
  const prefer = new Map<string, string>()
  for (const m of matches) {
    prefer.set(`${m.round}:${m.localTeamId}`, m.visitorTeamId)
    prefer.set(`${m.round}:${m.visitorTeamId}`, m.localTeamId)
  }

  // ── Rounds to solve: strictly after the edited round ──
  const byRound = new Map<number, ReorderMatch[]>()
  for (const m of matches) {
    const list = byRound.get(m.round) ?? []
    list.push(m)
    byRound.set(m.round, list)
  }

  const solveRounds: number[] = []
  for (let r = fixedRound + 1; r <= maxRound; r++) {
    if (byRound.has(r)) solveRounds.push(r)
  }

  // Free slots per round (matches the solver may re-pair).
  const freeSlots = new Map<number, ReorderMatch[]>()
  for (const r of solveRounds) {
    freeSlots.set(
      r,
      (byRound.get(r) ?? []).filter((m) => !m.frozen),
    )
  }

  // Fixed vertices per round (frozen matches; rounds before the edited one are
  // all frozen by construction).
  const fixedVertices = new Map<number, Set<string>>()
  for (const r of solveRounds) fixedVertices.set(r, new Set())
  for (const m of matches) {
    if (m.round <= fixedRound) continue
    if (!m.frozen) continue
    const set = fixedVertices.get(m.round)
    if (!set) continue
    set.add(m.localTeamId)
    set.add(m.visitorTeamId)
  }

  // ── Backtracking search ──
  let steps = 0
  const solution = new Map<number, [string, string][]>()

  function findMatching(
    remaining: string[],
    acc: [string, string][],
    round: number,
    onComplete: () => boolean,
  ): boolean {
    if (steps++ > MAX_STEPS) throw new Error("step-cap")
    if (remaining.length === 0) return onComplete()

    // MRV: pick the vertex with the fewest still-available partners.
    let bestV = remaining[0]
    let bestCands: string[] | null = null
    for (const v of remaining) {
      const cands = remaining.filter((w) => w !== v && !used.has(pairKey(v, w)))
      if (cands.length === 0) return false
      if (!bestCands || cands.length < bestCands.length) {
        bestV = v
        bestCands = cands
      }
    }

    const preferred = prefer.get(`${round}:${bestV}`)
    bestCands!.sort((x, y) => (x === preferred ? -1 : 0) - (y === preferred ? -1 : 0))

    for (const w of bestCands!) {
      const key = pairKey(bestV, w)
      used.add(key)
      acc.push([bestV, w])
      if (findMatching(remaining.filter((x) => x !== bestV && x !== w), acc, round, onComplete)) {
        return true
      }
      acc.pop()
      used.delete(key)
    }
    return false
  }

  function solve(roundIndex: number): boolean {
    if (steps++ > MAX_STEPS) throw new Error("step-cap")
    if (roundIndex >= solveRounds.length) return true

    const round = solveRounds[roundIndex]
    const fixed = fixedVertices.get(round)!
    const remaining = vertices.filter((v) => !fixed.has(v))
    const acc: [string, string][] = []

    return findMatching(remaining, acc, round, () => {
      solution.set(round, acc.map(([a, b]) => [a, b]))
      if (solve(roundIndex + 1)) return true
      solution.delete(round)
      return false
    })
  }

  try {
    if (!solve(0)) return { ok: false, reason: "no-solution" }
  } catch {
    return { ok: false, reason: "no-solution" }
  }

  // ── Map the solved pairings back onto the free slots ──
  const changes: ReorderChange[] = []

  for (const round of solveRounds) {
    const pairs = (solution.get(round) ?? [])
      .filter(([a, b]) => !a.startsWith(BYE) && !b.startsWith(BYE))
      .map(([a, b]) => [a, b] as [string, string])
    const slots = freeSlots.get(round) ?? []

    if (pairs.length !== slots.length) return { ok: false, reason: "no-solution" }

    const pool = [...pairs]
    const assigned = new Map<string, [string, string]>()

    // First pass: keep the original pairing when it survived.
    for (const slot of slots) {
      const idx = pool.findIndex(
        ([a, b]) => pairKey(a, b) === pairKey(slot.localTeamId, slot.visitorTeamId),
      )
      if (idx >= 0) {
        assigned.set(slot.id, pool[idx])
        pool.splice(idx, 1)
      }
    }

    // Second pass: assign whatever is left.
    for (const slot of slots) {
      if (assigned.has(slot.id)) continue
      assigned.set(slot.id, pool.shift()!)
    }

    for (const slot of slots) {
      const [a, b] = assigned.get(slot.id)!
      let local = a
      let visitor = b
      if (slot.localTeamId === a || slot.localTeamId === b) {
        local = slot.localTeamId
        visitor = slot.localTeamId === a ? b : a
      } else if (slot.visitorTeamId === a || slot.visitorTeamId === b) {
        visitor = slot.visitorTeamId
        local = slot.visitorTeamId === a ? b : a
      }
      if (local !== slot.localTeamId || visitor !== slot.visitorTeamId) {
        changes.push({ matchId: slot.id, localTeamId: local, visitorTeamId: visitor })
      }
    }
  }

  return { ok: true, changes }
}