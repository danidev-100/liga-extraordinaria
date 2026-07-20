import { notFound } from "next/navigation"
import { getLeagueBySlug } from "@/lib/get-league"

interface Props {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const league = await getLeagueBySlug(slug)
  if (!league) return { title: "Torneo no encontrado — Torneo Pro" }
  return {
    title: `${league.name} — Torneo Pro`,
    description: `${league.name} — Temporada ${league.season}`,
  }
}

export default async function LeagueLayout({ children, params }: Props) {
  const { slug } = await params
  const league = await getLeagueBySlug(slug)

  if (!league) notFound()

  return <>{children}</>
}
