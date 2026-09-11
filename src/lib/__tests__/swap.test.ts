import { describe, it, expect } from "vitest"
import { swapRivals, type SwapMatch } from "@/lib/matches/swap"

function m(id: string, round: number, localTeamId: string, visitorTeamId: string): SwapMatch {
  return { id, round, localTeamId, visitorTeamId }
}

describe("swapRivals", () => {
  it("swaps the visitors between two matches of the same round", () => {
    // J2: A-B, C-D  →  swap visitors → A-D, C-B
    const a = m("m1", 2, "A", "B")
    const b = m("m2", 2, "C", "D")
    const all = [a, b]

    const res = swapRivals(a, b, all)
    expect(res).toEqual({
      ok: true,
      changes: [
        { matchId: "m1", localTeamId: "A", visitorTeamId: "D" },
        { matchId: "m2", localTeamId: "C", visitorTeamId: "B" },
      ],
      warnings: [],
    })
  })

  it("rejects swaps across different rounds", () => {
    const a = m("m1", 1, "A", "B")
    const b = m("m2", 2, "C", "D")
    const res = swapRivals(a, b, [a, b])
    expect(res).toEqual({ ok: false, reason: "different-round" })
  })

  it("rejects swaps that would make a team face itself", () => {
    // If B already appears in the other match as visitor: A-B vs C-A → A-B (dup local)
    const a = m("m1", 2, "A", "B")
    const b = m("m2", 2, "C", "A")
    const res = swapRivals(a, b, [a, b])
    expect(res).toEqual({ ok: false, reason: "same-team" })
  })

  it("reports a warning when the swap repeats an encounter from another round", () => {
    // J2: A-B, C-D. J3 already has A-D.
    const a = m("m1", 2, "A", "B")
    const b = m("m2", 2, "C", "D")
    const other = m("m3", 3, "A", "D")
    const res = swapRivals(a, b, [a, b, other])
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.warnings).toEqual([
      { round: 3, localTeamId: "A", visitorTeamId: "D" },
    ])
  })

  it("reports both warnings when both new encounters repeat", () => {
    const a = m("m1", 2, "A", "B")
    const b = m("m2", 2, "C", "D")
    const other1 = m("m3", 3, "A", "D")
    const other2 = m("m4", 4, "C", "B")
    const res = swapRivals(a, b, [a, b, other1, other2])
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.warnings).toHaveLength(2)
    expect(res.warnings.some((w) => w.round === 3 && w.localTeamId === "A" && w.visitorTeamId === "D")).toBe(true)
    expect(res.warnings.some((w) => w.round === 4 && w.localTeamId === "C" && w.visitorTeamId === "B")).toBe(true)
  })

  it("returns no warnings when both new encounters are unique", () => {
    const a = m("m1", 2, "A", "B")
    const b = m("m2", 2, "C", "D")
    // A-D and B-C appear nowhere else
    const other = m("m3", 3, "A", "C")
    const res = swapRivals(a, b, [a, b, other])
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.warnings).toHaveLength(0)
  })
})