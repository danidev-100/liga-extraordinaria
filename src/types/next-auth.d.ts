import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      leagueId: string | null
      leagueSlug: string | null
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }

  interface User {
    role?: string
    leagueId?: string | null
    leagueSlug?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
    id?: string
    leagueId?: string | null
    leagueSlug?: string | null
  }
}
