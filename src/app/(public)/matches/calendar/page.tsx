import { redirectToScopedLeague } from "@/lib/old-path-redirect"

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string; leagueId?: string }>
}) {
  const { categoryId, leagueId } = await searchParams
  await redirectToScopedLeague("calendario", { leagueId, categoryId })
  return null
}
