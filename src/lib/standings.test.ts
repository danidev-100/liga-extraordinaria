import { describe, it, expect } from "vitest"
import { calculateStandings, type TeamInfo, type MatchResultData, type CardData } from "./standings"

const teams: TeamInfo[] = [
  { id: "t1", name: "River Plate", shortName: "RIV" },
  { id: "t2", name: "Boca Juniors", shortName: "BOC" },
  { id: "t3", name: "Independiente", shortName: "IND" },
  { id: "t4", name: "Racing Club", shortName: "RAC" },
]

describe("calculateStandings", () => {
  describe("Scoring: 3 pts for win, 1 for draw, 0 for loss", () => {
    it("should give 3 pts to winner and 0 to loser after one match", () => {
      const matches: MatchResultData[] = [
        { localTeamId: "t1", visitorTeamId: "t2", localScore: 3, visitorScore: 1 },
      ]

      const result = calculateStandings(teams, matches, [])

      const river = result.find((r) => r.teamId === "t1")!
      const boca = result.find((r) => r.teamId === "t2")!

      expect(river.pts).toBe(3)
      expect(river.pj).toBe(1)
      expect(river.pg).toBe(1)
      expect(river.pe).toBe(0)
      expect(river.pp).toBe(0)
      expect(river.gf).toBe(3)
      expect(river.gc).toBe(1)
      expect(river.dg).toBe(2)

      expect(boca.pts).toBe(0)
      expect(boca.pj).toBe(1)
      expect(boca.pg).toBe(0)
      expect(boca.pe).toBe(0)
      expect(boca.pp).toBe(1)
      expect(boca.gf).toBe(1)
      expect(boca.gc).toBe(3)
      expect(boca.dg).toBe(-2)
    })

    it("should give 1 point to each team on a draw", () => {
      const matches: MatchResultData[] = [
        { localTeamId: "t1", visitorTeamId: "t2", localScore: 2, visitorScore: 2 },
      ]

      const result = calculateStandings(teams, matches, [])

      const river = result.find((r) => r.teamId === "t1")!
      const boca = result.find((r) => r.teamId === "t2")!

      expect(river.pts).toBe(1)
      expect(river.pe).toBe(1)
      expect(boca.pts).toBe(1)
      expect(boca.pe).toBe(1)
    })

    it("should handle away win correctly", () => {
      const matches: MatchResultData[] = [
        { localTeamId: "t1", visitorTeamId: "t2", localScore: 0, visitorScore: 2 },
      ]

      const result = calculateStandings(teams, matches, [])

      const river = result.find((r) => r.teamId === "t1")!
      const boca = result.find((r) => r.teamId === "t2")!

      expect(river.pts).toBe(0)
      expect(river.pp).toBe(1)
      expect(boca.pts).toBe(3)
      expect(boca.pg).toBe(1)
    })
  })

  describe("Tiebreakers", () => {
    it("should break ties by goal difference", () => {
      const matches: MatchResultData[] = [
        { localTeamId: "t1", visitorTeamId: "t3", localScore: 5, visitorScore: 1 },
        { localTeamId: "t2", visitorTeamId: "t4", localScore: 3, visitorScore: 0 },
      ]

      const result = calculateStandings(teams, matches, [])

      const river = result.find((r) => r.teamId === "t1")!
      const boca = result.find((r) => r.teamId === "t2")!

      // Both have 3 pts, but River has +4 DG, Boca has +3 DG
      expect(river.pts).toBe(3)
      expect(boca.pts).toBe(3)
      expect(river.dg).toBe(4)
      expect(boca.dg).toBe(3)
      expect(result.indexOf(river)).toBeLessThan(result.indexOf(boca))
    })

    it("should break ties by goals for after goal difference", () => {
      // Both have same DG but different GF
      const matches: MatchResultData[] = [
        { localTeamId: "t1", visitorTeamId: "t3", localScore: 4, visitorScore: 2 },
        { localTeamId: "t2", visitorTeamId: "t4", localScore: 2, visitorScore: 0 },
      ]

      const result = calculateStandings(teams, matches, [])

      const river = result.find((r) => r.teamId === "t1")!
      const boca = result.find((r) => r.teamId === "t2")!

      // Both have 3 pts, +2 DG, but River has 4 GF vs Boca's 2 GF
      expect(river.pts).toBe(3)
      expect(boca.pts).toBe(3)
      expect(river.dg).toBe(2)
      expect(boca.dg).toBe(2)
      expect(river.gf).toBe(4)
      expect(boca.gf).toBe(2)
      expect(result.indexOf(river)).toBeLessThan(result.indexOf(boca))
    })

    it("should break ties alphabetically when all else is equal", () => {
      // Both teams have identical stats (3-1 win with same score)
      const matches: MatchResultData[] = [
        { localTeamId: "t3", visitorTeamId: "t1", localScore: 3, visitorScore: 1 },
        { localTeamId: "t4", visitorTeamId: "t2", localScore: 3, visitorScore: 1 },
      ]

      const result = calculateStandings(teams, matches, [])

      const ind = result.find((r) => r.teamId === "t3")!
      const rac = result.find((r) => r.teamId === "t4")!

      // Both have same pts, DG, and GF — alphabetical order applies
      expect(ind.pts).toBe(3)
      expect(rac.pts).toBe(3)
      // "Independiente" comes before "Racing Club" alphabetically
      expect(result.indexOf(ind)).toBeLessThan(result.indexOf(rac))
    })
  })

  describe("Edge cases", () => {
    it("should return all zeros when no matches are played", () => {
      const result = calculateStandings(teams, [], [])

      expect(result).toHaveLength(4)
      for (const row of result) {
        expect(row.pts).toBe(0)
        expect(row.pj).toBe(0)
        expect(row.pg).toBe(0)
        expect(row.pe).toBe(0)
        expect(row.pp).toBe(0)
        expect(row.gf).toBe(0)
        expect(row.gc).toBe(0)
        expect(row.dg).toBe(0)
        expect(row.ta).toBe(0)
        expect(row.tr).toBe(0)
      }

      // Alphabetically sorted: Boca, Independiente, Racing, River
      expect(result[0].teamId).toBe("t2") // Boca
      expect(result[1].teamId).toBe("t3") // Independiente
      expect(result[2].teamId).toBe("t4") // Racing
      expect(result[3].teamId).toBe("t1") // River
    })

    it("should handle incomplete round (only some matches finished)", () => {
      const matches: MatchResultData[] = [
        { localTeamId: "t1", visitorTeamId: "t2", localScore: 2, visitorScore: 1 },
        // t3 vs t4 not yet finished
      ]

      const result = calculateStandings(teams, matches, [])

      const river = result.find((r) => r.teamId === "t1")!
      const boca = result.find((r) => r.teamId === "t2")!
      const ind = result.find((r) => r.teamId === "t3")!
      const rac = result.find((r) => r.teamId === "t4")!

      // Only River and Boca have played
      expect(river.pj).toBe(1)
      expect(boca.pj).toBe(1)
      expect(ind.pj).toBe(0)
      expect(rac.pj).toBe(0)

      // Teams with no matches show zeros
      expect(ind.pts).toBe(0)
      expect(rac.pts).toBe(0)
    })

    it("should handle walkover/forfeit as a normal 1-0 win", () => {
      // Forfeit/walkover is scored as 1-0
      const matches: MatchResultData[] = [
        { localTeamId: "t1", visitorTeamId: "t2", localScore: 1, visitorScore: 0 },
      ]

      const result = calculateStandings(teams, matches, [])

      const river = result.find((r) => r.teamId === "t1")!
      expect(river.pts).toBe(3)
      expect(river.gf).toBe(1)
      expect(river.pg).toBe(1)
    })
  })

  describe("Cards tracking", () => {
    it("should count yellow and red cards per team", () => {
      const cards: CardData[] = [
        { teamId: "t1", type: "YELLOW" },
        { teamId: "t1", type: "YELLOW" },
        { teamId: "t2", type: "YELLOW" },
        { teamId: "t2", type: "RED" },
      ]

      const result = calculateStandings(teams, [], cards)

      const river = result.find((r) => r.teamId === "t1")!
      const boca = result.find((r) => r.teamId === "t2")!

      expect(river.ta).toBe(2)
      expect(river.tr).toBe(0)
      expect(boca.ta).toBe(1)
      expect(boca.tr).toBe(1)
    })
  })
})
