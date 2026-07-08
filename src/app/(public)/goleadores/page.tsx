import { redirectToScopedLeague } from "@/lib/old-path-redirect"

export default async function GoleadoresPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string; leagueId?: string }>
}) {
  const { categoryId, leagueId } = await searchParams
  await redirectToScopedLeague("goleadores", { leagueId, categoryId })
  return null
}
