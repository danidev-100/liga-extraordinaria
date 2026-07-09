export const dynamic = "force-dynamic"

import Link from "next/link"
import { notFound } from "next/navigation"
import db from "@/lib/db"
import { getLeagueBySlug } from "@/lib/get-league"
import { Calendar, Sparkles, List } from "lucide-react"
import { PrintButton } from "@/components/ui/print-button"
import { Badge } from "@/components/ui/badge"
import { MatchScheduleFilter } from "@/components/public/match-schedule-filter"
import { cn } from "@/lib/utils"
import { TeamLogo } from "@/components/ui/team-logo"
import { GoalBall, CardIcon } from "@/components/ui/card-icons"

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ categoryId?: string }>
}

const statusConfig = {
  SCHEDULED: { label: "Programado", variant: "secondary" as const },
  PLAYING: { label: "Jugando", variant: "default" as const },
  FINISHED: { label: "Finalizado", variant: "outline" as const },
}

async function MatchesContent({
  slug,
  categoryId,
}: {
  slug: string
  categoryId?: string
}) {
  const league = await getLeagueBySlug(slug)
  if (!league) notFound()

  const categories = await db.category.findMany({
    where: { leagueId: league.id },
    include: { league: { select: { name: true } } },
    orderBy: { name: "asc" },
  })

  const where: Record<string, unknown> = {}
  if (categoryId) {
    where.categoryId = categoryId
  } else {
    const leagueCategoryIds = categories.map((c) => c.id)
    if (leagueCategoryIds.length > 0) {
      where.categoryId = { in: leagueCategoryIds }
    }
  }

  const matches = await db.match.findMany({
    where,
    include: {
      category: { select: { name: true } },
      court: { select: { name: true } },
      localTeam: { select: { id: true, name: true, shortName: true, color: true, logoUrl: true } },
      visitorTeam: { select: { id: true, name: true, shortName: true, color: true, logoUrl: true } },
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
    orderBy: [{ round: "asc" }, { date: "asc" }, { time: "asc" }],
  })

  const groupedByRound = matches.reduce(
    (acc, match) => {
      const round = match.round
      if (!acc[round]) acc[round] = []
      acc[round].push(match)
      return acc
    },
    {} as Record<number, typeof matches>,
  )

  const rounds = Object.keys(groupedByRound)
    .map(Number)
    .sort((a, b) => a - b)

  const selectedCategory = categoryId
    ? categories.find((c) => c.id === categoryId)
    : undefined

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            {league.name} — Partidos
          </h1>
          <p className="mt-1 text-muted-foreground">
            Temporada {league.season} &middot; Programación y resultados
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <PrintButton />
          <MatchScheduleFilter categories={categories} currentCategoryId={categoryId} leagueSlug={slug} />
        </div>
      </div>

      <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-0.5 w-fit print:hidden">
        <Link
          href={`/liga/${slug}/partidos${categoryId ? `?categoryId=${categoryId}` : ""}`}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            "bg-background text-foreground shadow-sm",
          )}
        >
          <List className="h-4 w-4" />
          Lista
        </Link>
        <Link
          href={`/liga/${slug}/calendario${categoryId ? `?categoryId=${categoryId}` : ""}`}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Calendar className="h-4 w-4" />
          Calendario
        </Link>
      </div>

      {matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Calendar className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">No hay partidos programados</p>
          <p className="mt-1 text-sm text-muted-foreground/60">
            {selectedCategory
              ? `No hay partidos en ${selectedCategory.name}.`
              : categories.length > 0
                ? "Seleccioná una categoría para ver sus partidos."
                : "Los partidos aparecerán aquí cuando el administrador los cree."}
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {rounds.map((round) => {
            const roundMatches = groupedByRound[round]
            return (
              <section key={round}>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground shadow-sm">
                    {round}
                  </div>
                  <div>
                    <h2 className="font-heading text-xl font-semibold leading-none">Jornada {round}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {roundMatches.length} partido{roundMatches.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-1">
                  {roundMatches.map((match) => {
                    const status = statusConfig[match.status]
                    const isFinished = match.status === "FINISHED"
                    const isPlaying = match.status === "PLAYING"
                    const matchDate = new Date(match.date)
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    const isToday = matchDate.toDateString() === today.toDateString()

                    return (
                      <Link
                        key={match.id}
                        href={`/liga/${slug}/partidos/${match.id}`}
                        className="group relative block overflow-hidden rounded-xl border border-l-[3px] bg-card shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        style={{
                          borderLeftColor: match.localTeam.color || undefined,
                        }}
                      >
                        {isPlaying && <span className="absolute inset-x-0 top-0 h-1 bg-accent" />}

                        <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2">
                          <Badge variant={status.variant} className="gap-1">
                            {isPlaying && <Sparkles className="h-3 w-3 animate-pulse" />}
                            {status.label}
                          </Badge>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {isToday && !isPlaying && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Hoy</span>
                            )}
                            {isPlaying && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent-foreground">
                                <span className="relative flex h-2 w-2">
                                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                                </span>
                                EN VIVO
                              </span>
                            )}
                            <span>
                              {matchDate.toLocaleDateString("es-AR", {
                                weekday: "short", day: "numeric", month: "short",
                              })}
                            </span>
                            <span>&middot;</span>
                            <span>{match.time}</span>
                          </div>
                        </div>

                        <div className="p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
                              <TeamLogo logoUrl={match.localTeam.logoUrl} color={match.localTeam.color} name={match.localTeam.name} size="md" />
                              <span className="text-sm font-semibold leading-tight">{match.localTeam.shortName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {isFinished && match.localScore !== null && match.visitorScore !== null ? (
                                <span className="text-2xl font-bold tabular-nums tracking-tight">
                                  <span className="text-primary">{match.localScore}</span>
                                  <span className="mx-1.5 text-muted-foreground/50">-</span>
                                  <span className="text-primary">{match.visitorScore}</span>
                                </span>
                              ) : (
                                <span className="text-lg font-medium text-muted-foreground/40">vs</span>
                              )}
                            </div>
                            <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
                              <TeamLogo logoUrl={match.visitorTeam.logoUrl} color={match.visitorTeam.color} name={match.visitorTeam.name} size="md" />
                              <span className="text-sm font-semibold leading-tight">{match.visitorTeam.shortName}</span>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                            <span>{match.court.name}</span>
                            <span>&middot;</span>
                            <span>{match.category.name}</span>
                          </div>

                          {isFinished && (match.goals.length > 0 || match.cards.length > 0) && (
                            <div className="mt-3 space-y-1.5 border-t pt-3">
                              {match.goals.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Goles</p>
                                  {match.goals.map((goal) => {
                                    const isLocal = goal.teamId === match.localTeam.id
                                    return (
                                      <div key={goal.id} className="flex items-center gap-1.5 text-xs">
                                        <GoalBall />
                                        <TeamLogo logoUrl={goal.team.logoUrl} color={goal.team.color} name={goal.team.name} size="sm" />
                                        <span className="shrink-0 text-[10px] font-semibold text-muted-foreground">{goal.team.shortName}</span>
                                        <span className="font-medium">{goal.player.name} {goal.player.surname}</span>
                                        {goal.isOwnGoal && <span className="rounded bg-destructive/10 px-1 py-0.5 text-[10px] text-destructive">e/c</span>}
                                        <span className="text-muted-foreground">{goal.minute}&apos;</span>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                              {match.cards.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Tarjetas</p>
                                  {match.cards.map((card) => {
                                    const isLocal = card.teamId === match.localTeam.id
                                    const isDoubleYellowRed = card.type === "RED" && card.isSecondYellow
                                    return (
                                      <div key={card.id} className="flex items-center gap-1.5 text-xs">
                                        <CardIcon type={card.type as "YELLOW" | "RED"} isSecondYellow={isDoubleYellowRed} />
                                        <TeamLogo logoUrl={card.team.logoUrl} color={card.team.color} name={card.team.name} size="sm" />
                                        <span className="shrink-0 text-[10px] font-semibold text-muted-foreground">{card.team.shortName}</span>
                                        <span className="font-medium">{card.player.name} {card.player.surname}</span>
                                        {isDoubleYellowRed && <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">2A</span>}
                                        <span className="text-muted-foreground">{card.minute}&apos;</span>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}

      <style>{`
        @media print {
          a { color: inherit !important; text-decoration: none !important; }
          section { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  )
}

export default async function LeagueMatchesPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { categoryId } = await searchParams

  return <MatchesContent slug={slug} categoryId={categoryId} />
}
