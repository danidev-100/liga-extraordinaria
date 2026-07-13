export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import Link from "next/link"
import db from "@/lib/db"
import { getLeagueBySlug } from "@/lib/get-league"
import { ArrowLeft } from "lucide-react"
import { MatchHeader } from "@/components/public/match-header"
import { MatchTimeline } from "@/components/public/match-timeline"
import { MatchStats } from "@/components/public/match-stats"
import { TeamLogo } from "@/components/ui/team-logo"

interface Props {
  params: Promise<{ slug: string; id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug, id } = await params
  const league = await getLeagueBySlug(slug)
  if (!league) return { title: "Partido no encontrado" }

  const match = await db.match.findUnique({
    where: { id },
    select: {
      localTeam: { select: { name: true } },
      visitorTeam: { select: { name: true } },
      date: true,
    },
  })

  if (!match) return { title: "Partido no encontrado — Liga" }

  const matchDate = new Date(match.date).toLocaleDateString("es-AR", {
    day: "numeric", month: "short", year: "numeric",
  })

  return {
    title: `${match.localTeam.name} vs ${match.visitorTeam.name} — ${matchDate} — ${league.name}`,
    description: `Detalle del partido entre ${match.localTeam.name} y ${match.visitorTeam.name}`,
  }
}

export default async function LeagueMatchDetailPage({ params }: Props) {
  const { slug, id } = await params

  const league = await getLeagueBySlug(slug)
  if (!league) notFound()

  const match = await db.match.findUnique({
    where: { id },
    include: {
      category: { select: { name: true } },
      court: { select: { name: true } },
      localTeam: {
        select: { id: true, name: true, shortName: true, color: true, logoUrl: true },
      },
      visitorTeam: {
        select: { id: true, name: true, shortName: true, color: true, logoUrl: true },
      },
      goals: {
        include: {
          player: { select: { name: true, surname: true } },
          team: { select: { id: true, name: true, shortName: true, color: true, logoUrl: true } },
        },
        orderBy: { minute: "asc" },
      },
      cards: {
        include: {
          player: { select: { name: true, surname: true } },
          team: { select: { id: true, name: true, shortName: true, color: true, logoUrl: true } },
        },
        orderBy: { minute: "asc" },
      },
    },
  })

  if (!match) notFound()

  return (
    <div className="space-y-6">
      <Link
        href={`/liga/${slug}/partidos`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al calendario
      </Link>

      <MatchHeader
        leagueSlug={slug}
        localTeam={match.localTeam}
        visitorTeam={match.visitorTeam}
        localScore={match.localScore}
        visitorScore={match.visitorScore}
        status={match.status}
        category={match.category}
        court={match.court}
        date={match.date}
        time={match.time}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MatchTimeline
            localTeamId={match.localTeam.id}
            visitorTeamId={match.visitorTeam.id}
            goals={match.goals}
            cards={match.cards}
          />
        </div>

        <div>
          <MatchStats
            localTeam={match.localTeam}
            visitorTeam={match.visitorTeam}
            localScore={match.localScore}
            visitorScore={match.visitorScore}
            goals={match.goals}
            cards={match.cards}
          />

          <div className="mt-4 space-y-2">
            <Link
              href={`/liga/${slug}/equipos/${match.localTeam.id}`}
              className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted/50"
            >
              <TeamLogo logoUrl={match.localTeam.logoUrl} color={match.localTeam.color} name={match.localTeam.name} size="md" />
              Ver ficha de {match.localTeam.name}
            </Link>
            <Link
              href={`/liga/${slug}/equipos/${match.visitorTeam.id}`}
              className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted/50"
            >
              <TeamLogo logoUrl={match.visitorTeam.logoUrl} color={match.visitorTeam.color} name={match.visitorTeam.name} size="md" />
              Ver ficha de {match.visitorTeam.name}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
