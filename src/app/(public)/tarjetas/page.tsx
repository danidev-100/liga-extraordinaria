import { redirectToScopedLeague } from "@/lib/old-path-redirect"

export default async function TarjetasPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string; leagueId?: string }>
}) {
  const { categoryId, leagueId } = await searchParams
  await redirectToScopedLeague("tarjetas", { leagueId, categoryId })
  return null
}
