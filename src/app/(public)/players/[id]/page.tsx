import { redirectToScopedLeague } from "@/lib/old-path-redirect"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PlayerProfilePage({ params }: PageProps) {
  const { id } = await params
  await redirectToScopedLeague("jugadores", { id })
  return null
}
