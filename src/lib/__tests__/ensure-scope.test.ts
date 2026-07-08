import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockAuth = vi.fn()
const mockDb = {
  league: {
    findUnique: vi.fn(),
  },
  admin: {
    findUnique: vi.fn(),
  },
}

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}))

vi.mock("@/lib/db", () => ({
  default: mockDb,
}))

// Import after mocks are set up
const { ensureScope } = await import("../ensure-scope")

// ── Helpers ─────────────────────────────────────────────────────────────────

function mockSession(overrides: Record<string, unknown> = {}) {
  return {
    user: { id: "user-1", email: "admin@test.com", name: "Admin", role: "ADMIN", leagueId: null, ...overrides },
  }
}

function mockLeague(overrides: Record<string, unknown> = {}) {
  return { id: "league-1", name: "Test League", slug: "test-league", ...overrides }
}

function mockAdmin(overrides: Record<string, unknown> = {}) {
  return { id: "user-1", role: "ADMIN", leagueId: "league-1", ...overrides }
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("ensureScope", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("authentication", () => {
    it("should throw when no session exists", async () => {
      mockAuth.mockResolvedValue(null)

      await expect(ensureScope("test-league")).rejects.toThrow("No autorizado")
    })

    it("should throw when session has no user id", async () => {
      mockAuth.mockResolvedValue({ user: {} })

      await expect(ensureScope("test-league")).rejects.toThrow("No autorizado")
    })
  })

  describe("league resolution", () => {
    it("should throw when league slug does not exist", async () => {
      mockAuth.mockResolvedValue(mockSession())
      mockDb.league.findUnique.mockResolvedValue(null)

      await expect(ensureScope("non-existent")).rejects.toThrow("Liga no encontrada")

      expect(mockDb.league.findUnique).toHaveBeenCalledWith({
        where: { slug: "non-existent" },
      })
    })

    it("should throw when admin user is not found", async () => {
      mockAuth.mockResolvedValue(mockSession())
      mockDb.league.findUnique.mockResolvedValue(mockLeague())
      mockDb.admin.findUnique.mockResolvedValue(null)

      await expect(ensureScope("test-league")).rejects.toThrow("Usuario no encontrado")
    })
  })

  describe("SUPER_ADMIN bypass", () => {
    it("should allow SUPER_ADMIN to access any league", async () => {
      mockAuth.mockResolvedValue(mockSession({ role: "SUPER_ADMIN", leagueId: null }))
      mockDb.league.findUnique.mockResolvedValue(mockLeague({ id: "league-b" }))
      mockDb.admin.findUnique.mockResolvedValue(mockAdmin({ role: "SUPER_ADMIN", leagueId: null }))

      const result = await ensureScope("test-league")

      expect(result).toEqual({ leagueId: "league-b", isSuperAdmin: true })
    })

    it("should allow SUPER_ADMIN to access their own league too", async () => {
      mockAuth.mockResolvedValue(mockSession({ role: "SUPER_ADMIN", leagueId: "league-1" }))
      mockDb.league.findUnique.mockResolvedValue(mockLeague())
      mockDb.admin.findUnique.mockResolvedValue(mockAdmin({ role: "SUPER_ADMIN", leagueId: "league-1" }))

      const result = await ensureScope("test-league")

      expect(result).toEqual({ leagueId: "league-1", isSuperAdmin: true })
    })
  })

  describe("regular admin scoping", () => {
    it("should allow admin to access their own league", async () => {
      mockAuth.mockResolvedValue(mockSession({ role: "ADMIN", leagueId: "league-1" }))
      mockDb.league.findUnique.mockResolvedValue(mockLeague())
      mockDb.admin.findUnique.mockResolvedValue(mockAdmin())

      const result = await ensureScope("test-league")

      expect(result).toEqual({ leagueId: "league-1", isSuperAdmin: false })
    })

    it("should reject admin trying to access another league", async () => {
      mockAuth.mockResolvedValue(mockSession({ role: "ADMIN", leagueId: "league-1" }))
      mockDb.league.findUnique.mockResolvedValue(mockLeague({ id: "league-b" }))
      mockDb.admin.findUnique.mockResolvedValue(mockAdmin())

      await expect(ensureScope("league-b")).rejects.toThrow("No tenés acceso a esta liga")
    })

    it("should reject admin with no leagueId trying to access any league", async () => {
      mockAuth.mockResolvedValue(mockSession({ role: "ADMIN", leagueId: null }))
      mockDb.league.findUnique.mockResolvedValue(mockLeague())
      mockDb.admin.findUnique.mockResolvedValue(mockAdmin({ leagueId: null }))

      await expect(ensureScope("test-league")).rejects.toThrow("No tenés acceso a esta liga")
    })
  })

  describe("return value", () => {
    it("should return leagueId and isSuperAdmin on success", async () => {
      mockAuth.mockResolvedValue(mockSession())
      mockDb.league.findUnique.mockResolvedValue(mockLeague())
      mockDb.admin.findUnique.mockResolvedValue(mockAdmin())

      const result = await ensureScope("test-league")

      expect(result).toHaveProperty("leagueId")
      expect(result).toHaveProperty("isSuperAdmin")
      expect(typeof result.leagueId).toBe("string")
      expect(typeof result.isSuperAdmin).toBe("boolean")
    })
  })
})
