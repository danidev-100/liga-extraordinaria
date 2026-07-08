import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth(async function middleware(req) {
  // Extract slug from /liga/[slug]/... paths and attach to query params
  const ligaMatch = req.nextUrl.pathname.match(/^\/liga\/([^/]+)/)
  if (ligaMatch) {
    const slug = ligaMatch[1]
    const url = req.nextUrl.clone()
    url.searchParams.set("leagueSlug", slug)
    return NextResponse.rewrite(url)
  }

  // /admin/* routes are already protected by authConfig.authorized callback
  return NextResponse.next()
})

export const config = {
  matcher: ["/admin/:path*", "/liga/:path*"],
}
