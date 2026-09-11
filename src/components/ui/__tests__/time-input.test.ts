import { describe, it, expect } from "vitest"
import { parseTimeParts, TIME_HOURS, TIME_MINUTES } from "@/components/ui/time-input"

describe("TimeInput", () => {
  it("has 24 hour options (00-23)", () => {
    expect(TIME_HOURS).toHaveLength(24)
    expect(TIME_HOURS[0]).toBe("00")
    expect(TIME_HOURS[23]).toBe("23")
    expect(TIME_HOURS).toContain("14")
  })

  it("has 15-minute step options", () => {
    expect(TIME_MINUTES).toEqual(["00", "15", "30", "45"])
  })

  it("keeps exact step values", () => {
    expect(parseTimeParts("14:30")).toEqual({ hours: "14", minutes: "30" })
    expect(parseTimeParts("09:00")).toEqual({ hours: "09", minutes: "00" })
    expect(parseTimeParts("23:45")).toEqual({ hours: "23", minutes: "45" })
  })

  it("rounds a non-step minute to the closest quarter", () => {
    expect(parseTimeParts("14:07")).toEqual({ hours: "14", minutes: "00" })
    expect(parseTimeParts("14:22")).toEqual({ hours: "14", minutes: "15" })
    expect(parseTimeParts("14:38")).toEqual({ hours: "14", minutes: "45" })
  })

  it("wraps a rounded minute of 60 back to :00", () => {
    expect(parseTimeParts("14:59")).toEqual({ hours: "14", minutes: "00" })
  })

  it("falls back to 20:00 for invalid values", () => {
    expect(parseTimeParts("garbage")).toEqual({ hours: "20", minutes: "00" })
    expect(parseTimeParts("")).toEqual({ hours: "20", minutes: "00" })
    expect(parseTimeParts("99:99")).toEqual({ hours: "20", minutes: "00" })
  })

  it("normalizes single-digit hours", () => {
    expect(parseTimeParts("9:30")).toEqual({ hours: "09", minutes: "30" })
  })
})