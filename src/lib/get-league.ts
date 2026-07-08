import db from "./db"

export async function getLeagueBySlug(slug: string) {
  const league = await db.league.findUnique({ where: { slug } })
  if (!league) return null
  return league
}
