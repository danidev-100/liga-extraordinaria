import { redirectToScopedLeague } from "@/lib/old-path-redirect"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MatchDetailPage({ params }: PageProps) {
  const { id } = await params
  await redirectToScopedLeague("partidos", { id })
  return null
}
