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
    })
  })

  it("rejects swaps across different rounds", () => {
    const a = m("m1", 1, "A", "B")
    const b = m("m2", 2, "C", "D")
    const res = swapRivals(a, b, [a, b])
    expect(res).toEqual({ ok: false, reason: "different-round" })
  })

  it("rejects swaps that would make a team face itself", () => {
    // If B already appears in the other match as visitor: A-B vs C-B → A-B (dup local)
    const a = m("m1", 2, "A", "B")
    const b = m("m2", 2, "C", "A")
    const res = swapRivals(a, b, [a, b])
    expect(res).toEqual({ ok: false, reason: "same-team" })
  })

  it("rejects swaps that create a duplicate encounter in another round", () => {
    // J2: A-B, C-D. J3 already has A-D.
    const a = m("m1", 2, "A", "B")
    const b = m("m2", 2, "C", "D")
    const other = m("m3", 3, "A", "D")
    const res = swapRivals(a, b, [a, b, other])
    expect(res).toEqual({
      ok: false,
      reason: "duplicate",
      round: 3,
      localTeamId: "A",
      visitorTeamId: "D",
    })
  })

  it("allows the swap when both new encounters are unique", () => {
    const a = m("m1", 2, "A", "B")
    const b = m("m2", 2, "C", "D")
    // A-D and B-C appear nowhere else
    const other = m("m3", 3, "A", "C")
    const res = swapRivals(a, b, [a, b, other])
    expect(res.ok).toBe(true)
  })
})