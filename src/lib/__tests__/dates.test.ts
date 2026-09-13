import { describe, it, expect } from "vitest"
import { toSafeIsoDate, isValidDate, datePartsOf, formatDateDDMMYYYY } from "@/lib/dates"

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

describe("datePartsOf", () => {
  it("extracts the calendar date from an ISO date string", () => {
    expect(datePartsOf("1977-05-05")).toEqual({ y: 1977, m: 5, d: 5 })
  })

  it("extracts the calendar date from a full ISO timestamp without timezone shift", () => {
    // 1977-05-05T00:00:00Z must NOT become May 4 in UTC-3/UTC-4 zones
    expect(datePartsOf("1977-05-05T00:00:00.000Z")).toEqual({ y: 1977, m: 5, d: 5 })
  })

  it("extracts the calendar date from a Date without timezone shift", () => {
    expect(datePartsOf(new Date("1977-05-05T00:00:00.000Z"))).toEqual({ y: 1977, m: 5, d: 5 })
  })

  it("parses dd/mm/yyyy strings", () => {
    expect(datePartsOf("05/05/1977")).toEqual({ y: 1977, m: 5, d: 5 })
  })

  it("returns null for missing or invalid values", () => {
    expect(datePartsOf(null)).toBeNull()
    expect(datePartsOf(undefined)).toBeNull()
    expect(datePartsOf("not-a-date")).toBeNull()
  })
})

describe("formatDateDDMMYYYY", () => {
  it("formats as dd/mm/yyyy", () => {
    expect(formatDateDDMMYYYY("1977-05-05T00:00:00.000Z")).toBe("05/05/1977")
    expect(formatDateDDMMYYYY(new Date("1977-05-05T00:00:00.000Z"))).toBe("05/05/1977")
    expect(formatDateDDMMYYYY("22/03/2006")).toBe("22/03/2006")
  })

  it("pads day and month with zeros", () => {
    expect(formatDateDDMMYYYY("2006-03-02")).toBe("02/03/2006")
  })

  it("returns an empty string for missing or invalid values", () => {
    expect(formatDateDDMMYYYY(null)).toBe("")
    expect(formatDateDDMMYYYY(undefined)).toBe("")
    expect(formatDateDDMMYYYY("not-a-date")).toBe("")
  })
})