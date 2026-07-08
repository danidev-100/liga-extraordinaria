import { redirectToScopedLeague } from "@/lib/old-path-redirect"

export default async function PublicStandingsPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string; leagueId?: string }>
}) {
  const { categoryId, leagueId } = await searchParams
  await redirectToScopedLeague("posiciones", { leagueId, categoryId })
  return null
}
