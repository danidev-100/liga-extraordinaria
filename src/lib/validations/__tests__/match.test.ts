import { describe, it, expect } from "vitest"
import { matchSchema } from "@/lib/validations/match"
import { finishMatchSchema, goalSchema, cardSchema } from "@/lib/validations/match-result"

describe("matchSchema (create match)", () => {
  const validMatch = {
    categoryId: "550e8400-e29b-41d4-a716-446655440000",
    courtId: "550e8400-e29b-41d4-a716-446655440001",
    date: "2026-07-15",
    time: "15:00",
    localTeamId: "550e8400-e29b-41d4-a716-446655440002",
    visitorTeamId: "550e8400-e29b-41d4-a716-446655440003",
    round: 1,
  }

  it("should accept valid match data", () => {
    const result = matchSchema.safeParse(validMatch)
    expect(result.success).toBe(true)
  })

  it("should reject same team for local and visitor", () => {
    const invalid = { ...validMatch, visitorTeamId: validMatch.localTeamId }
    const result = matchSchema.safeParse(invalid)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes("diferentes"))).toBe(true)
    }
  })

  it("should reject missing categoryId", () => {
    const { categoryId, ...invalid } = validMatch
    const result = matchSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it("should reject invalid UUID for courtId", () => {
    const invalid = { ...validMatch, courtId: "not-a-uuid" }
    const result = matchSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it("should reject missing date", () => {
    const { date, ...invalid } = validMatch
    const result = matchSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it("should reject round less than 1", () => {
    const invalid = { ...validMatch, round: 0 }
    const result = matchSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it("should coerce string round to number", () => {
    const result = matchSchema.safeParse({ ...validMatch, round: "2" })
    expect(result.success).toBe(true)
  })
})

describe("finishMatchSchema (match result)", () => {
  it("should accept valid finish data", () => {
    const valid = {
      localScore: 3,
      visitorScore: 1,
      goals: [],
      cards: [],
    }
    const result = finishMatchSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it("should reject negative scores", () => {
    const invalid = { localScore: -1, visitorScore: 0 }
    const result = finishMatchSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it("should accept zero scores", () => {
    const valid = { localScore: 0, visitorScore: 0 }
    const result = finishMatchSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it("should default goals and cards to empty arrays", () => {
    const valid = { localScore: 1, visitorScore: 2 }
    const result = finishMatchSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.goals).toEqual([])
      expect(result.data.cards).toEqual([])
    }
  })

  it("should coerce string scores to numbers", () => {
    const valid = { localScore: "3", visitorScore: "1" }
    const result = finishMatchSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.localScore).toBe(3)
      expect(result.data.visitorScore).toBe(1)
    }
  })
})

describe("goalSchema", () => {
  it("should accept a valid goal", () => {
    const valid = {
      playerId: "550e8400-e29b-41d4-a716-446655440010",
      teamId: "550e8400-e29b-41d4-a716-446655440002",
      minute: 23,
    }
    const result = goalSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it("should accept an own goal", () => {
    const valid = {
      playerId: "550e8400-e29b-41d4-a716-446655440010",
      teamId: "550e8400-e29b-41d4-a716-446655440002",
      minute: 45,
      isOwnGoal: true,
    }
    const result = goalSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.isOwnGoal).toBe(true)
    }
  })

  it("should reject minute below 1", () => {
    const invalid = {
      playerId: "550e8400-e29b-41d4-a716-446655440010",
      teamId: "550e8400-e29b-41d4-a716-446655440002",
      minute: 0,
    }
    const result = goalSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it("should reject minute above 120", () => {
    const invalid = {
      playerId: "550e8400-e29b-41d4-a716-446655440010",
      teamId: "550e8400-e29b-41d4-a716-446655440002",
      minute: 121,
    }
    const result = goalSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})

describe("cardSchema", () => {
  it("should accept a valid yellow card", () => {
    const valid = {
      playerId: "550e8400-e29b-41d4-a716-446655440010",
      teamId: "550e8400-e29b-41d4-a716-446655440002",
      type: "YELLOW",
      minute: 55,
    }
    const result = cardSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it("should accept a valid red card", () => {
    const valid = {
      playerId: "550e8400-e29b-41d4-a716-446655440010",
      teamId: "550e8400-e29b-41d4-a716-446655440002",
      type: "RED",
      minute: 80,
    }
    const result = cardSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it("should reject invalid card type", () => {
    const invalid = {
      playerId: "550e8400-e29b-41d4-a716-446655440010",
      teamId: "550e8400-e29b-41d4-a716-446655440002",
      type: "BLUE",
      minute: 30,
    }
    const result = cardSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})
