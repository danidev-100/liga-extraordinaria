import { describe, it, expect } from "vitest"
import { parseFechaParam, buildScheduleHref } from "@/lib/schedule-params"

describe("parseFechaParam", () => {
  it("accepts positive integers", () => {
    expect(parseFechaParam("1")).toBe(1)
    expect(parseFechaParam("7")).toBe(7)
    expect(parseFechaParam("10")).toBe(10)
    expect(parseFechaParam("42")).toBe(42)
  })

  it("tolerates surrounding whitespace", () => {
    expect(parseFechaParam(" 5 ")).toBe(5)
  })

  it("rejects non-positive values", () => {
    expect(parseFechaParam("0")).toBeUndefined()
    expect(parseFechaParam("-1")).toBeUndefined()
    expect(parseFechaParam("-100")).toBeUndefined()
  })

  it("rejects non-integer values", () => {
    expect(parseFechaParam("3.5")).toBeUndefined()
    expect(parseFechaParam("1.0000001")).toBeUndefined()
  })

  it("rejects non-numeric strings", () => {
    expect(parseFechaParam("abc")).toBeUndefined()
    expect(parseFechaParam("7abc")).toBeUndefined()
    expect(parseFechaParam("NaN")).toBeUndefined()
    expect(parseFechaParam("Infinity")).toBeUndefined()
  })

  it("rejects empty and missing values", () => {
    expect(parseFechaParam("")).toBeUndefined()
    expect(parseFechaParam("   ")).toBeUndefined()
    expect(parseFechaParam(undefined)).toBeUndefined()
    expect(parseFechaParam(null)).toBeUndefined()
  })

  it("rejects values that are not strings", () => {
    expect(parseFechaParam(7)).toBeUndefined()
    expect(parseFechaParam(true)).toBeUndefined()
  })
})

describe("buildScheduleHref", () => {
  it("returns the bare path when there are no params", () => {
    expect(buildScheduleHref("/liga/supercampeones/partidos")).toBe(
      "/liga/supercampeones/partidos",
    )
    expect(buildScheduleHref("/liga/supercampeones/partidos", {})).toBe(
      "/liga/supercampeones/partidos",
    )
  })

  it("omits null and empty values", () => {
    expect(buildScheduleHref("/x", { categoryId: null, fecha: null })).toBe("/x")
    expect(buildScheduleHref("/x", { categoryId: "", fecha: undefined })).toBe("/x")
  })

  it("builds a category-only url", () => {
    expect(buildScheduleHref("/x", { categoryId: "abc" })).toBe("/x?categoryId=abc")
  })

  it("builds a fecha-only url", () => {
    expect(buildScheduleHref("/x", { fecha: 7 })).toBe("/x?fecha=7")
  })

  it("builds a combined url preserving both params", () => {
    expect(buildScheduleHref("/x", { categoryId: "abc", fecha: 7 })).toBe(
      "/x?categoryId=abc&fecha=7",
    )
  })

  it("drops an invalid fecha so a broken url degrades to the category filter", () => {
    expect(buildScheduleHref("/x", { categoryId: "abc", fecha: 0 })).toBe(
      "/x?categoryId=abc",
    )
    expect(buildScheduleHref("/x", { fecha: 2.5 })).toBe("/x")
  })
})
