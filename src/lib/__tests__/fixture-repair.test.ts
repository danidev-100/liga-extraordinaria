import { describe, it, expect } from "vitest"
import { repairFixture, BYE, type RepairMatch } from "@/lib/matches/fixture-repair"

/** Build a single round-robin fixture using the circle method (mirrors the generator). */
function buildRR(teams: string[]): [string, string][][] {
  const n = teams.length
  const isEven = n % 2 === 0
  const circle = isEven ? [...teams] : [...teams, BYE]
  const totalSlots = circle.length
  const rounds = isEven ? n - 1 : n
  const out: [string, string][][] = []

  for (let r = 0; r < rounds; r++) {
    const pairs: [string, string][] = []
    for (let i = 0; i < totalSlots / 2; i++) {
      const home = circle[i]
      const away = circle[totalSlots - 1 - i]
      if (home === BYE || away === BYE) continue
      pairs.push([home, away])
    }
    out.push(pairs)

    const fixed = circle[0]
    const rest = circle.slice(1)
    const rotated = [rest[rest.length - 1], ...rest.slice(0, -1)]
    circle[0] = fixed
    for (let i = 0; i < rotated.length; i++) circle[i + 1] = rotated[i]
  }
  return out
}

function toMatches(rounds: [string, string][][]): RepairMatch[] {
  const out: RepairMatch[] = []
  rounds.forEach((pairs, ri) => {
    pairs.forEach(([a, b], mi) => {
      out.push({
        id: `m${ri + 1}-${mi}`,
        round: ri + 1,
        localTeamId: a,
        visitorTeamId: b,
        frozen: false,
      })
    })
  })
  return out
}

function key(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

function applyChanges(matches: RepairMatch[], changes: { matchId: string; localTeamId: string; visitorTeamId: string }[]): RepairMatch[] {
  const map = new Map(changes.map((c) => [c.matchId, c]))
  return matches.map((m) => {
    const c = map.get(m.id)
    return c ? { ...m, localTeamId: c.localTeamId, visitorTeamId: c.visitorTeamId } : { ...m }
  })
}

/** Every pair meets at most once and no team plays twice in the same round. */
function assertValidFixture(matches: RepairMatch[]) {
  const seen = new Set<string>()
  const byRound = new Map<number, string[]>()
  for (const m of matches) {
    const k = key(m.localTeamId, m.visitorTeamId)
    expect(seen.has(k)).toBe(false)
    seen.add(k)
    const arr = byRound.get(m.round) ?? []
    arr.push(m.localTeamId, m.visitorTeamId)
    byRound.set(m.round, arr)
  }
  for (const [, arr] of byRound) {
    expect(new Set(arr).size).toBe(arr.length)
  }
}

function pairOf(matches: RepairMatch[], id: string): string {
  const m = matches.find((x) => x.id === id)!
  return key(m.localTeamId, m.visitorTeamId)
}

describe("repairFixture", () => {
  it("relocates the following rounds when a team changes (N=4)", () => {
    const teams = ["A", "B", "C", "D"]
    const matches = toMatches(buildRR(teams))
    // R2 match0 is A-C; change C -> B (A-B already lives in R3).
    const res = repairFixture({
      teams,
      matches,
      editedMatchId: "m2-0",
      newLocalTeamId: "A",
      newVisitorTeamId: "B",
    })

    expect(res.ok).toBe(true)
    if (!res.ok) return

    const updated = applyChanges(matches, res.changes)
    const edited = updated.find((m) => m.id === "m2-0")!
    edited.localTeamId = "A"
    edited.visitorTeamId = "B"

    assertValidFixture(updated)
    // Frozen round 1 is untouched.
    expect(pairOf(updated, "m1-0")).toBe(key("A", "D"))
    expect(pairOf(updated, "m1-1")).toBe(key("B", "C"))
    expect(res.changes.every((c) => !c.matchId.startsWith("m1-"))).toBe(true)
  })

  it("relocates with an odd team count and keeps one team resting per round (N=5)", () => {
    const teams = ["A", "B", "C", "D", "E"]
    const matches = toMatches(buildRR(teams))
    // R2 match0 is A-E; change E -> D (A-D already lives in R3).
    const res = repairFixture({
      teams,
      matches,
      editedMatchId: "m2-0",
      newLocalTeamId: "A",
      newVisitorTeamId: "D",
    })

    expect(res.ok).toBe(true)
    if (!res.ok) return

    const updated = applyChanges(matches, res.changes)
    const edited = updated.find((m) => m.id === "m2-0")!
    edited.localTeamId = "A"
    edited.visitorTeamId = "D"

    assertValidFixture(updated)
    expect(res.changes.every((c) => !c.matchId.startsWith("m1-"))).toBe(true)
  })

  it("returns no changes when the encounter already fits", () => {
    const teams = ["A", "B", "C", "D"]
    const matches = toMatches(buildRR(teams))
    const res = repairFixture({
      teams,
      matches,
      editedMatchId: "m2-0",
      newLocalTeamId: "A",
      newVisitorTeamId: "C",
    })
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.changes).toHaveLength(0)
  })

  it("reports a frozen conflict when the new pair was played in an earlier round", () => {
    const teams = ["A", "B", "C", "D"]
    const matches = toMatches(buildRR(teams))
    // R2 match0 is A-C; B-C already happened in R1 (frozen).
    const res = repairFixture({
      teams,
      matches,
      editedMatchId: "m2-0",
      newLocalTeamId: "B",
      newVisitorTeamId: "C",
    })
    expect(res).toEqual({ ok: false, reason: "frozen-conflict", round: 1 })
  })

  it("reports a frozen conflict when the new pair is already played in a later round", () => {
    const teams = ["A", "B", "C", "D"]
    const matches = toMatches(buildRR(teams))
    // Freeze R3 match1 (C-D) as if it had been played ahead of time.
    const frozen = matches.map((m) => (m.id === "m3-1" ? { ...m, frozen: true } : m))
    const res = repairFixture({
      teams,
      matches: frozen,
      editedMatchId: "m2-0",
      newLocalTeamId: "C",
      newVisitorTeamId: "D",
    })
    expect(res).toEqual({ ok: false, reason: "frozen-conflict", round: 3 })
  })

  it("never moves a frozen match in a later round", () => {
    const teams = ["A", "B", "C", "D", "E", "F"]
    const matches = toMatches(buildRR(teams))
    // Freeze a last-round match as if it had been played ahead of time.
    const frozen = matches.map((m) => (m.id === "m5-0" ? { ...m, frozen: true } : m))
    const edited = frozen.find((m) => m.id === "m2-0")!

    let succeeded = false
    for (const candidate of teams) {
      if (candidate === edited.localTeamId) continue
      const res = repairFixture({
        teams,
        matches: frozen,
        editedMatchId: "m2-0",
        newLocalTeamId: edited.localTeamId,
        newVisitorTeamId: candidate,
      })
      if (!res.ok) continue

      succeeded = true
      expect(res.changes.some((c) => c.matchId === "m5-0")).toBe(false)
      const updated = applyChanges(frozen, res.changes)
      updated.find((m) => m.id === "m2-0")!.visitorTeamId = candidate
      assertValidFixture(updated)
      break
    }
    expect(succeeded).toBe(true)
  })

  it("returns no-solution when a frozen later match blocks every completion", () => {
    const teams = ["A", "B", "C", "D"]
    const matches = toMatches(buildRR(teams))
    // Freeze R3 match1 (C-D); changing R2 A-C -> A-B forces C-D in R2, but it is frozen.
    const frozen = matches.map((m) => (m.id === "m3-1" ? { ...m, frozen: true } : m))
    const res = repairFixture({
      teams,
      matches: frozen,
      editedMatchId: "m2-0",
      newLocalTeamId: "A",
      newVisitorTeamId: "B",
    })
    expect(res).toEqual({ ok: false, reason: "no-solution" })
  })
})