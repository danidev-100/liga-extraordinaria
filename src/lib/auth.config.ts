import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  providers: [],
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnAdmin = nextUrl.pathname.startsWith("/admin")
      if (isOnAdmin && !isLoggedIn) return false

      // League-scoped public routes are always accessible
      if (nextUrl.pathname.startsWith("/liga/")) return true

      return true
    },
  },
} satisfies NextAuthConfig
