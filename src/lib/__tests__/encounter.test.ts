import { describe, it, expect } from "vitest"
import { findDuplicateEncounter, type EncounterMatch } from "@/lib/matches/encounter"

const matches: EncounterMatch[] = [
  { id: "m1", round: 1, localTeamId: "A", visitorTeamId: "B" },
  { id: "m2", round: 1, localTeamId: "C", visitorTeamId: "D" },
  { id: "m3", round: 2, localTeamId: "E", visitorTeamId: "A" },
  { id: "m4", round: 2, localTeamId: "F", visitorTeamId: "G" },
  { id: "m5", round: 3, localTeamId: "H", visitorTeamId: "I" },
]

describe("findDuplicateEncounter", () => {
  it("detects the same pair in another round", () => {
    expect(findDuplicateEncounter(matches, { localTeamId: "A", visitorTeamId: "B" })).toEqual({
      round: 1,
    })
  })

  it("detects the pair in reverse order (no home/away)", () => {
    expect(findDuplicateEncounter(matches, { localTeamId: "B", visitorTeamId: "A" })).toEqual({
      round: 1,
    })
    expect(findDuplicateEncounter(matches, { localTeamId: "A", visitorTeamId: "E" })).toEqual({
      round: 2,
    })
  })

  it("ignores the match being edited (excludeMatchId)", () => {
    expect(
      findDuplicateEncounter(matches, { id: "m1", localTeamId: "A", visitorTeamId: "B" }),
    ).toBeNull()
  })

  it("returns null when the encounter is unique", () => {
    expect(findDuplicateEncounter(matches, { localTeamId: "C", visitorTeamId: "B" })).toBeNull()
    expect(findDuplicateEncounter(matches, { localTeamId: "J", visitorTeamId: "K" })).toBeNull()
  })

  it("returns null when teams are missing", () => {
    expect(findDuplicateEncounter(matches, { localTeamId: null, visitorTeamId: "B" })).toBeNull()
    expect(findDuplicateEncounter(matches, { localTeamId: "A", visitorTeamId: null })).toBeNull()
    expect(findDuplicateEncounter(matches, { localTeamId: null, visitorTeamId: null })).toBeNull()
  })

  it("returns null for a same-team candidate", () => {
    expect(findDuplicateEncounter(matches, { localTeamId: "A", visitorTeamId: "A" })).toBeNull()
  })

  it("skips matches with missing teams", () => {
    const withNulls: EncounterMatch[] = [
      { id: "m1", round: 1, localTeamId: "A", visitorTeamId: null },
      { id: "m2", round: 2, localTeamId: null, visitorTeamId: "B" },
    ]
    expect(findDuplicateEncounter(withNulls, { localTeamId: "A", visitorTeamId: "B" })).toBeNull()
  })

  it("returns the earliest duplicate round", () => {
    const doubled: EncounterMatch[] = [
      { id: "m1", round: 2, localTeamId: "A", visitorTeamId: "B" },
      { id: "m2", round: 5, localTeamId: "B", visitorTeamId: "A" },
    ]
    expect(findDuplicateEncounter(doubled, { localTeamId: "A", visitorTeamId: "B" })).toEqual({
      round: 2,
    })
  })
})