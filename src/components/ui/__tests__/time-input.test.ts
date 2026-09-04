import { describe, it, expect } from "vitest"
import { normalizeTimeInput } from "@/components/ui/time-input"

describe("normalizeTimeInput", () => {
  it("keeps valid 24h values", () => {
    expect(normalizeTimeInput("14:00")).toBe("14:00")
    expect(normalizeTimeInput("09:05")).toBe("09:05")
    expect(normalizeTimeInput("23:59")).toBe("23:59")
  })

  it("normalizes 12h PM values to 24h", () => {
    expect(normalizeTimeInput("2:00 PM")).toBe("14:00")
    expect(normalizeTimeInput("02:00 pm")).toBe("14:00")
    expect(normalizeTimeInput("12:30 PM")).toBe("12:30")
  })

  it("normalizes 12h AM values to 24h", () => {
    expect(normalizeTimeInput("2:00 AM")).toBe("02:00")
    expect(normalizeTimeInput("12:30 AM")).toBe("00:30")
  })

  it("shapes progressive typing into HH:mm", () => {
    expect(normalizeTimeInput("1")).toBe("1")
    expect(normalizeTimeInput("14")).toBe("14")
    expect(normalizeTimeInput("140")).toBe("14:0")
    expect(normalizeTimeInput("1400")).toBe("14:00")
  })

  it("handles plain hour:minute without meridiem", () => {
    expect(normalizeTimeInput("9:30")).toBe("09:30")
  })
})