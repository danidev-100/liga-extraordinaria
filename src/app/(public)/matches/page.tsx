import { redirectToScopedLeague } from "@/lib/old-path-redirect"

export default async function PublicMatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string; leagueId?: string }>
}) {
  const { categoryId, leagueId } = await searchParams
  await redirectToScopedLeague("partidos", { leagueId, categoryId })
  return null
}
