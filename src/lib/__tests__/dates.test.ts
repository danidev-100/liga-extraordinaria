import { describe, it, expect } from "vitest"
import { toSafeIsoDate, isValidDate } from "@/lib/dates"

describe("toSafeIsoDate", () => {
  it("returns the ISO string for a valid date", () => {
    expect(toSafeIsoDate(new Date("2000-01-01T00:00:00Z"))).toBe("2000-01-01T00:00:00.000Z")
    expect(toSafeIsoDate("2000-01-01")).toBe("2000-01-01T00:00:00.000Z")
  })

  it("returns null for missing values", () => {
    expect(toSafeIsoDate(null)).toBeNull()
    expect(toSafeIsoDate(undefined)).toBeNull()
  })

  it("returns null for invalid dates instead of throwing", () => {
    expect(() => toSafeIsoDate(new Date("not-a-date"))).not.toThrow()
    expect(toSafeIsoDate(new Date("not-a-date"))).toBeNull()
    expect(toSafeIsoDate("not-a-date")).toBeNull()
    expect(toSafeIsoDate("19974-13-45")).toBeNull()
  })
})

describe("isValidDate", () => {
  it("accepts valid dates", () => {
    expect(isValidDate(new Date("2000-01-01"))).toBe(true)
    expect(isValidDate("2000-01-01")).toBe(true)
  })

  it("rejects invalid or missing dates", () => {
    expect(isValidDate(new Date("not-a-date"))).toBe(false)
    expect(isValidDate("not-a-date")).toBe(false)
    expect(isValidDate(null)).toBe(false)
    expect(isValidDate(undefined)).toBe(false)
  })
})