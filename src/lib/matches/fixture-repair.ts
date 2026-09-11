/**
 * Fixture repair for round-robin categories.
 *
 * When an admin changes the teams of a match, the rest of the fixture must be
 * re-arranged so that no pair of teams meets twice, while:
 *  - rounds before the edited one are frozen (already played / decided),
 *  - matches already played (FINISHED/PLAYING) are frozen anywhere in the season,
 *  - the edited encounter stays in its round,
 *  - every team plays exactly once per round (or rests when the team count is odd).
 *
 * The repair is a bounded backtracking search over perfect matchings. It keeps
 * the original pairing whenever possible to minimise churn.
 */

/** Sentinel vertex used to represent the resting ("libre") team on odd team counts. */
export const BYE = "__BYE__"

export interface RepairMatch {
  id: string
  round: number
  localTeamId: string
  visitorTeamId: string
  frozen: boolean
}

export interface RepairInput {
  /** Team ids that belong to the category. */
  teams: string[]
  /** Every match of the category. */
  matches: RepairMatch[]
  /** The match being edited. */
  editedMatchId: string
  /** The new (unordered) encounter for the edited match. */
  newLocalTeamId: string
  newVisitorTeamId: string
}

export interface RepairChange {
  matchId: string
  localTeamId: string
  visitorTeamId: string
}

export type RepairResult =
  | { ok: true; changes: RepairChange[] }
  | { ok: false; reason: "frozen-conflict"; round: number }
  | { ok: false; reason: "no-solution" }

const MAX_STEPS = 250_000

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

export function repairFixture(input: RepairInput): RepairResult {
  const { teams, matches, editedMatchId, newLocalTeamId, newVisitorTeamId } = input

  const edited = matches.find((m) => m.id === editedMatchId)
  if (!edited) return { ok: false, reason: "no-solution" }

  const editedRound = edited.round
  const newPairKey = pairKey(newLocalTeamId, newVisitorTeamId)

  // A match is frozen when it was explicitly marked (already played) or when it
  // belongs to a round before the edited one — those are never touched.
  const isFrozen = (m: RepairMatch) => m.frozen || m.round < editedRound

  // ── Frozen pairs (cannot be changed) ──
  const frozenPairs = new Map<string, number>()
  for (const m of matches) {
    if (m.id === editedMatchId || !isFrozen(m)) continue
    const key = pairKey(m.localTeamId, m.visitorTeamId)
    if (!frozenPairs.has(key)) frozenPairs.set(key, m.round)
  }

  // The edited encounter must not collide with something already played.
  const conflictRound = frozenPairs.get(newPairKey)
  if (conflictRound !== undefined) {
    return { ok: false, reason: "frozen-conflict", round: conflictRound }
  }

  // ── Vertices (add BYE when the team count is odd) ──
  const vertices = teams.length % 2 !== 0 ? [...teams, BYE] : [...teams]

  const used = new Set<string>(frozenPairs.keys())
  used.add(newPairKey)

  // Original opponents, used to prefer keeping the current pairing.
  const prefer = new Map<string, string>()
  for (const m of matches) {
    prefer.set(`${m.round}:${m.localTeamId}`, m.visitorTeamId)
    prefer.set(`${m.round}:${m.visitorTeamId}`, m.localTeamId)
  }

  // ── Rounds to repair: the edited round and everything after it ──
  const maxRound = matches.reduce((max, m) => Math.max(max, m.round), editedRound)
  const byRound = new Map<number, RepairMatch[]>()
  for (const m of matches) {
    const list = byRound.get(m.round) ?? []
    list.push(m)
    byRound.set(m.round, list)
  }

  const solveRounds: number[] = []
  for (let r = editedRound; r <= maxRound; r++) {
    if (byRound.has(r)) solveRounds.push(r)
  }

  // Fixed vertices per round (frozen matches + the edited match with its new pair).
  const fixedVertices = new Map<number, Set<string>>()
  for (const r of solveRounds) fixedVertices.set(r, new Set())
  for (const m of matches) {
    if (m.id === editedMatchId) {
      const set = fixedVertices.get(m.round)
      if (set) {
        set.add(newLocalTeamId)
        set.add(newVisitorTeamId)
      }
      continue
    }
    if (!isFrozen(m)) continue
    const set = fixedVertices.get(m.round)
    if (!set) continue
    set.add(m.localTeamId)
    set.add(m.visitorTeamId)
  }

  // Free slots per round (matches the solver may re-pair).
  const freeSlots = new Map<number, RepairMatch[]>()
  for (const r of solveRounds) {
    freeSlots.set(
      r,
      (byRound.get(r) ?? []).filter((m) => m.id !== editedMatchId && !isFrozen(m)),
    )
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
  const changes: RepairChange[] = []

  for (const round of solveRounds) {
    const pairs = (solution.get(round) ?? [])
      .filter(([a, b]) => a !== BYE && b !== BYE)
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