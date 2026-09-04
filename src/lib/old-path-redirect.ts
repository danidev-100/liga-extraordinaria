import { notFound, permanentRedirect } from "next/navigation"
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

type EntityResolution =
  | { found: true; slug: string | null }
  | { found: false }

/**
 * Resolves the canonical league slug for an entity-scoped legacy path.
 * Returns null when the pathFragment is not entity-scoped.
 */
async function resolveEntityLeagueSlug(
  pathFragment: string,
  id: string,
): Promise<EntityResolution | null> {
  switch (pathFragment) {
    case "equipos": {
      const team = await db.team.findUnique({
        where: { id },
        select: { category: { select: { league: { select: { slug: true } } } } },
      })
      return team ? { found: true, slug: team.category.league.slug } : { found: false }
    }
    case "jugadores": {
      const player = await db.player.findUnique({
        where: { id },
        select: {
          team: { select: { category: { select: { league: { select: { slug: true } } } } } },
        },
      })
      return player ? { found: true, slug: player.team.category.league.slug } : { found: false }
    }
    case "partidos": {
      const match = await db.match.findUnique({
        where: { id },
        select: { category: { select: { league: { select: { slug: true } } } } },
      })
      return match ? { found: true, slug: match.category.league.slug } : { found: false }
    }
    default:
      return null
  }
}

export async function redirectToScopedLeague(
  pathFragment: string,
  options?: { leagueId?: string; categoryId?: string; id?: string },
) {
  let slug: string | null = null

  if (options?.id) {
    const resolved = await resolveEntityLeagueSlug(pathFragment, options.id)
    if (resolved) {
      if (!resolved.found) notFound()
      if (!resolved.slug) notFound()
      slug = resolved.slug
    }
  }

  if (!slug && options?.leagueId) {
    const league = await db.league.findUnique({
      where: { id: options.leagueId },
      select: { slug: true },
    })
    if (league) {
      if (!league.slug) notFound()
      slug = league.slug
    }
  }

  if (!slug) {
    slug = await getDefaultLeagueSlug()
  }

  if (!slug) notFound()

  const params = new URLSearchParams()
  if (options?.categoryId) params.set("categoryId", options.categoryId)
  const qs = params.toString()
  const base = `/liga/${slug}/${pathFragment}${options?.id ? `/${options.id}` : ""}`
  permanentRedirect(qs ? `${base}?${qs}` : base)
}