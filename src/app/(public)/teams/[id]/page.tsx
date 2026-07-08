import { redirectToScopedLeague } from "@/lib/old-path-redirect"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TeamDetailPage({ params }: PageProps) {
  const { id } = await params
  await redirectToScopedLeague("equipos", { id })
  return null
}
