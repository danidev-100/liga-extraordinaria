import { redirectToScopedLeague } from "@/lib/old-path-redirect"

export default async function VallasPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string; leagueId?: string }>
}) {
  const { categoryId, leagueId } = await searchParams
  await redirectToScopedLeague("vallas", { leagueId, categoryId })
  return null
}