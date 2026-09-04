import { describe, it, expect } from "vitest"
import { resolveTeamShield, TEAM_SHIELDS } from "@/lib/team-shields"

describe("resolveTeamShield", () => {
  it("resolves exact team names", () => {
    expect(resolveTeamShield("Andes Origen")).toBe("/escudos/Andes Origen.jpeg")
    expect(resolveTeamShield("Unidos FC")).toBe("/escudos/Unidos FC.jpeg")
  })

  it("is case insensitive", () => {
    expect(resolveTeamShield("andes origen")).toBe("/escudos/Andes Origen.jpeg")
    expect(resolveTeamShield("REAL SOCIEDAD")).toBe("/escudos/Real Sociedad.jpeg")
  })

  it("ignores accents", () => {
    expect(resolveTeamShield("Fundación Gargantini")).toBe("/escudos/Fundacion Gargantini.jpeg")
    expect(resolveTeamShield("Fundacion Gargantini")).toBe("/escudos/Fundacion Gargantini.jpeg")
    expect(resolveTeamShield("Rey León")).toBe("/escudos/Rey Leon.jpeg")
    expect(resolveTeamShield("Barrilete Cósmico")).toBe("/escudos/Barrilete Cosmico.jpeg")
  })

  it("matches compact forms (cata50 vs Cata 50)", () => {
    expect(resolveTeamShield("Cata 50")).toBe("/escudos/cata50.jpeg")
    expect(resolveTeamShield("Cata50")).toBe("/escudos/cata50.jpeg")
  })

  it("returns null for unknown or empty names", () => {
    expect(resolveTeamShield("Equipo Inexistente")).toBeNull()
    expect(resolveTeamShield("")).toBeNull()
    expect(resolveTeamShield(null)).toBeNull()
    expect(resolveTeamShield(undefined)).toBeNull()
  })

  it("covers every escudo file in the map", () => {
    expect(Object.keys(TEAM_SHIELDS).length).toBe(18)
    for (const shieldPath of Object.values(TEAM_SHIELDS)) {
      expect(shieldPath).toMatch(/^\/escudos\//)
    }
  })
})