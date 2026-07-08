import { permanentRedirect } from "next/navigation"
import db from "./db"

export async function getDefaultLeagueSlug(): Promise<string | null> {
  const leagues = await db.league.findMany({
    where: { slug: { not: null } },
    take: 2,
    orderBy: { createdAt: "asc" },
  })
  if (leagues.length === 1 && leagues[0].slug) return leagues[0].slug
  return null
}

export async function redirectToScopedLeague(
  pathFragment: string,
  options?: { leagueId?: string; categoryId?: string; id?: string },
) {
  let slug: string | null = null

  if (options?.leagueId) {
    const league = await db.league.findUnique({
      where: { id: options.leagueId },
      select: { slug: true },
    })
    if (league?.slug) slug = league.slug
  }

  if (!slug) {
    slug = await getDefaultLeagueSlug()
  }

  if (slug) {
    const params = new URLSearchParams()
    if (options?.categoryId) params.set("categoryId", options.categoryId)
    const qs = params.toString()
    const base = `/liga/${slug}/${pathFragment}${options?.id ? `/${options.id}` : ""}`
    permanentRedirect(qs ? `${base}?${qs}` : base)
  } else {
    permanentRedirect("/")
  }
}
