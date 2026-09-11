import { describe, it, expect } from "vitest"
import { reorderRoundFixture, type ReorderMatch } from "@/lib/matches/reorder-round"

function m(id: string, round: number, localTeamId: string, visitorTeamId: string, frozen = false): ReorderMatch {
  return { id, round, localTeamId, visitorTeamId, frozen }
}

function key(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

/** Build a single round-robin using the circle method. */
function buildRR(teams: string[]): [string, string][][] {
  const n = teams.length
  const isEven = n % 2 === 0
  const circle = isEven ? [...teams] : [...teams, "__BYE__"]
  const totalSlots = circle.length
  const rounds = isEven ? n - 1 : n
  const out: [string, string][][] = []
  for (let r = 0; r < rounds; r++) {
    const pairs: [string, string][] = []
    for (let i = 0; i < totalSlots / 2; i++) {
      const home = circle[i]
      const away = circle[totalSlots - 1 - i]
      if (home === "__BYE__" || away === "__BYE__") continue
      pairs.push(r % 2 === 0 ? [home, away] : [away, home])
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

function toMatches(rounds: [string, string][][]): ReorderMatch[] {
  const out: ReorderMatch[] = []
  rounds.forEach((pairs, ri) => {
    pairs.forEach(([a, b], mi) => {
      out.push({ id: `m${ri + 1}-${mi}`, round: ri + 1, localTeamId: a, visitorTeamId: b, frozen: false })
    })
  })
  return out
}

function applyChanges(matches: ReorderMatch[], changes: { matchId: string; localTeamId: string; visitorTeamId: string }[]): ReorderMatch[] {
  const map = new Map(changes.map((c) => [c.matchId, c]))
  return matches.map((x) => {
    const c = map.get(x.id)
    return c ? { ...x, localTeamId: c.localTeamId, visitorTeamId: c.visitorTeamId } : { ...x }
  })
}

function assertValidFixture(matches: ReorderMatch[]) {
  const seen = new Set<string>()
  const byRound = new Map<number, string[]>()
  for (const mm of matches) {
    const k = key(mm.localTeamId, mm.visitorTeamId)
    expect(seen.has(k)).toBe(false)
    seen.add(k)
    const arr = byRound.get(mm.round) ?? []
    arr.push(mm.localTeamId, mm.visitorTeamId)
    byRound.set(mm.round, arr)
  }
  for (const [, arr] of byRound) {
    expect(new Set(arr).size).toBe(arr.length)
  }
}

describe("reorderRoundFixture", () => {
  it("keeps rounds before fixedRound untouched and re-solves from it (N=4)", () => {
    const teams = ["A", "B", "C", "D"]
    const matches = toMatches(buildRR(teams))
    // R1: A-D, B-C. R2: A-C, B-D. R3: A-B, C-D.
    // Admin edits R2 to A-B, C-D (a valid round). R3 must become A-C, B-D.
    const edited = matches.map((x) => {
      if (x.id === "m2-0") return { ...x, localTeamId: "A", visitorTeamId: "B" }
      if (x.id === "m2-1") return { ...x, localTeamId: "C", visitorTeamId: "D" }
      return x
    })

    const res = reorderRoundFixture({ teams, matches: edited, fixedRound: 2 })
    expect(res.ok).toBe(true)
    if (!res.ok) return

    const updated = applyChanges(edited, res.changes)
    assertValidFixture(updated)
    // Round 1 frozen untouched.
    expect(res.changes.every((c) => !c.matchId.startsWith("m1-"))).toBe(true)
    // The edited round's chosen crossings survive (preference).
    const r2 = updated.filter((x) => x.round === 2)
    expect(r2.some((x) => key(x.localTeamId, x.visitorTeamId) === key("A", "B"))).toBe(true)
    expect(r2.some((x) => key(x.localTeamId, x.visitorTeamId) === key("C", "D"))).toBe(true)
  })

  it("returns no-solution when the edited round is internally inconsistent (updateMatch prevents this)", () => {
    const teams = ["A", "B", "C", "D"]
    const matches = toMatches(buildRR(teams))
    // Admin edits ONLY m2-0 to A-B but leaves m2-1 as B-D: B plays twice in R2.
    // The solver freezes the edited round, so an inconsistent edited round is
    // rejected (updateMatch validates this before saving).
    const edited = matches.map((x) => (x.id === "m2-0" ? { ...x, localTeamId: "A", visitorTeamId: "B" } : x))

    const res = reorderRoundFixture({ teams, matches: edited, fixedRound: 2 })
    expect(res).toEqual({ ok: false, reason: "no-solution" })
  })

  it("supports resting teams when the edited round has fewer slots", () => {
    const teams = ["A", "B", "C", "D"]
    const matches = toMatches(buildRR(teams))
    // Simulate: R2 only has 1 match (A-B), C and D rest.
    const edited = matches.map((x) => {
      if (x.id === "m2-1") return { ...x, round: 99 } // park this match out of the way
      if (x.id === "m2-0") return { ...x, localTeamId: "A", visitorTeamId: "B" }
      return x
    }).filter((x) => x.round !== 99)

    const res = reorderRoundFixture({ teams, matches: edited, fixedRound: 2 })
    expect(res.ok).toBe(true)
    if (!res.ok) return

    const updated = applyChanges(edited, res.changes)
    assertValidFixture(updated)
  })

  it("freezes FINISHED/PLAYING matches anywhere", () => {
    const teams = ["A", "B", "C", "D", "E", "F"]
    const matches = toMatches(buildRR(teams))
    // R1: A-F, B-E, C-D. R2: A-E, F-D, B-C.
    // Freeze a round-5 match as if already played.
    const withFrozen = matches.map((x) => (x.id === "m5-0" ? { ...x, frozen: true } : x))
    // Edit round 2 to A-D, B-F, C-E (all unique, none in R1), forcing later relocation.
    const edited = withFrozen.map((x) => {
      if (x.id === "m2-0") return { ...x, localTeamId: "A", visitorTeamId: "D" }
      if (x.id === "m2-1") return { ...x, localTeamId: "B", visitorTeamId: "F" }
      if (x.id === "m2-2") return { ...x, localTeamId: "C", visitorTeamId: "E" }
      return x
    })

    const res = reorderRoundFixture({ teams, matches: edited, fixedRound: 2 })
    expect(res.ok).toBe(true)
    if (!res.ok) return

    expect(res.changes.some((c) => c.matchId === "m5-0")).toBe(false)
    const updated = applyChanges(edited, res.changes)
    assertValidFixture(updated)
  })

  it("returns no-solution when frozen later matches make it impossible", () => {
    const teams = ["A", "B", "C", "D"]
    const matches = toMatches(buildRR(teams))
    // Freeze round 3 m3-1 (C-D). Round 2 A-C -> A-B forces C-D in round 2, but C-D is frozen in round 3.
    const withFrozen = matches.map((x) => (x.id === "m3-1" ? { ...x, frozen: true } : x))
    const edited = withFrozen.map((x) => (x.id === "m2-0" ? { ...x, localTeamId: "A", visitorTeamId: "B" } : x))

    const res = reorderRoundFixture({ teams, matches: edited, fixedRound: 2 })
    expect(res).toEqual({ ok: false, reason: "no-solution" })
  })

  it("handles odd team counts with a bye", () => {
    const teams = ["A", "B", "C", "D", "E"]
    const matches = toMatches(buildRR(teams))
    const res = reorderRoundFixture({ teams, matches, fixedRound: 2 })
    expect(res.ok).toBe(true)
    if (!res.ok) return
    const updated = applyChanges(matches, res.changes)
    assertValidFixture(updated)
  })

  it("returns no changes when the fixture is already valid from the fixed round", () => {
    const teams = ["A", "B", "C", "D"]
    const matches = toMatches(buildRR(teams))
    const res = reorderRoundFixture({ teams, matches, fixedRound: 2 })
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.changes).toHaveLength(0)
  })
})