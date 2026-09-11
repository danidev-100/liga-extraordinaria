import Link from "next/link"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ensureScope } from "@/lib/ensure-scope"
import db from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Clock, Play, CheckCircle2, Calendar, ArrowUpDown, CalendarClock, CalendarPlus } from "lucide-react"
import { DeleteButton } from "@/components/forms/delete-button"
import { deleteMatch, postponeMatch, rescheduleMatch } from "@/actions/matches"
import { Badge } from "@/components/ui/badge"
import { TeamLogo } from "@/components/ui/team-logo"
import { RoundVisibilityToggle } from "@/components/ui/round-visibility-toggle"
import { SwapRivalsButton } from "@/components/forms/swap-rivals-button"
import { ReorderRoundButton } from "@/components/forms/reorder-round-button"

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ categoryId?: string }>
}

const statusConfig = {
  SCHEDULED: {
    label: "Programado",
    variant: "secondary" as const,
    icon: Clock,
    borderClass: "border-l-primary/40",
  },
  PLAYING: {
    label: "Jugando",
    variant: "default" as const,
    icon: Play,
    borderClass: "border-l-accent",
  },
  FINISHED: {
    label: "Finalizado",
    variant: "outline" as const,
    icon: CheckCircle2,
    borderClass: "border-l-muted-foreground/30",
  },
  POSTPONED: {
    label: "Postergado",
    variant: "outline" as const,
    icon: CalendarClock,
    borderClass: "border-l-amber-500/60",
  },
}

export default async function ScopedMatchesPage({ params, searchParams }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { slug } = await params
  const { leagueId } = await ensureScope(slug)
  const { categoryId } = await searchParams

  const categories = await db.category.findMany({
    where: { leagueId },
    include: { league: { select: { name: true } } },
    orderBy: { name: "asc" },
  })

  const leagueCategoryIds = categories.map((c) => c.id)

  const matchWhere: Record<string, unknown> = {}
  if (categoryId) {
    matchWhere.categoryId = categoryId
  } else {
    if (leagueCategoryIds.length > 0) {
      matchWhere.categoryId = { in: leagueCategoryIds }
    }
  }

  const matches = await db.match.findMany({
    where: Object.keys(matchWhere).length > 0 ? matchWhere : undefined,
    include: {
      category: { select: { name: true } },
      court: { select: { name: true, venue: { select: { name: true } } } },
      localTeam: { select: { id: true, name: true, shortName: true, logoUrl: true, color: true } },
      visitorTeam: { select: { id: true, name: true, shortName: true, logoUrl: true, color: true } },
    },
    orderBy: [{ round: "asc" }, { date: "asc" }, { time: "asc" }],
  })

  const hiddenRounds = await db.roundVisibility.findMany({
    where: { categoryId: { in: leagueCategoryIds }, hidden: true },
  })
  const hiddenRoundMap = new Map(hiddenRounds.map((h) => [`${h.categoryId}:${h.round}`, true]))

  const teams = await db.team.findMany({
    where: categoryId
      ? { categoryId }
      : { categoryId: { in: leagueCategoryIds } },
    select: { id: true, name: true, shortName: true, color: true, logoUrl: true, categoryId: true },
    orderBy: { name: "asc" },
  })

  const playedByCategoryRound = new Map<string, Map<number, Set<string>>>()
  for (const match of matches) {
    if (!playedByCategoryRound.has(match.categoryId)) {
      playedByCategoryRound.set(match.categoryId, new Map())
    }
    const roundMap = playedByCategoryRound.get(match.categoryId)!
    if (!roundMap.has(match.round)) {
      roundMap.set(match.round, new Set())
    }
    roundMap.get(match.round)!.add(match.localTeamId)
    roundMap.get(match.round)!.add(match.visitorTeamId)
  }

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

  const freeTeamsByRound = new Map<number, typeof teams>()
  for (const round of rounds) {
    const roundMatches = groupedByRound[round]
    const categoriesWithMatches = new Set(roundMatches.map((m) => m.categoryId))
    const freeTeams = teams
      .filter(
        (team) =>
          categoriesWithMatches.has(team.categoryId) &&
          !playedByCategoryRound.get(team.categoryId)?.get(round)?.has(team.id),
      )
      .sort((a, b) => a.name.localeCompare(b.name))
    if (freeTeams.length > 0) {
      freeTeamsByRound.set(round, freeTeams)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Partidos
          </h1>
          <p className="text-muted-foreground">
            Gestioná la programación y resultados de los partidos
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/admin/matches/reorder`}>
            <Button variant="outline">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Reordenar
            </Button>
          </Link>
          <Link href={`/admin/ligas/${slug}/fixture/new`}>
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Generar<span className="hidden sm:inline"> Temporada</span>
            </Button>
          </Link>
          <Link href={`/admin/matches/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo<span className="hidden sm:inline"> Partido</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/admin/ligas/${slug}/matches`}>
          <Badge
            variant={!categoryId ? "default" : "outline"}
            className={`cursor-pointer rounded-full px-4 py-1.5 h-auto text-sm font-medium transition-colors ${
              !categoryId ? "" : "bg-muted text-muted-foreground"
            }`}
          >
            Todas
          </Badge>
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/admin/ligas/${slug}/matches?categoryId=${cat.id}`}
          >
            <Badge
              variant={categoryId === cat.id ? "default" : "outline"}
              className={`cursor-pointer rounded-full px-4 py-1.5 h-auto text-sm font-medium transition-colors ${
                categoryId === cat.id ? "" : "bg-muted text-muted-foreground"
              }`}
            >
              {cat.name}
            </Badge>
          </Link>
        ))}
      </div>

      {/* Match list */}
      {matches.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-16">
          <p className="text-center text-muted-foreground">
            No hay partidos registrados.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {rounds.map((round) => {
            const roundMatches = groupedByRound[round]
            const freeTeams = freeTeamsByRound.get(round) ?? []
            const catsInRound = Array.from(
              new Map(roundMatches.map((m) => [m.categoryId, m.category.name])).entries(),
            )

            return (
              <section key={round} className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-sm font-bold text-foreground">
                    {round}
                  </div>
                  <h2 className="text-sm font-semibold text-muted-foreground">Jornada {round}</h2>
                  {catsInRound.length === 1 ? (
                    <RoundVisibilityToggle
                      categoryId={catsInRound[0][0]}
                      round={round}
                      hidden={hiddenRoundMap.get(`${catsInRound[0][0]}:${round}`) ?? false}
                    />
                  ) : (
                    catsInRound.map(([categoryId, name]) => (
                      <RoundVisibilityToggle
                        key={categoryId}
                        categoryId={categoryId}
                        round={round}
                        hidden={hiddenRoundMap.get(`${categoryId}:${round}`) ?? false}
                        label={name}
                      />
                    ))
                  )}
                  {catsInRound.length === 1 && (
                    <ReorderRoundButton categoryId={catsInRound[0][0]} round={round} leagueSlug={slug} />
                  )}
                </div>

                {roundMatches.map((match) => {
                  const status = statusConfig[match.status]
                  const StatusIcon = status.icon

                  return (
                    <div
                      key={match.id}
                      className={`rounded-lg border border-border bg-card ${status.borderClass} border-l-4 p-5 transition-shadow hover:shadow-sm`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        {/* Left: match info */}
                        <div className="min-w-0 space-y-2">
                          {/* Status + round */}
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={status.variant}
                              className={
                                match.status === "POSTPONED"
                                  ? "gap-1.5 px-2.5 py-0.5 text-xs font-semibold border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                  : "gap-1.5 px-2.5 py-0.5 text-xs font-semibold"
                              }
                            >
                              <StatusIcon className="h-3.5 w-3.5" />
                              {status.label}
                            </Badge>
                            <span className="text-xs font-medium text-muted-foreground">
                              R{match.round}
                            </span>
                          </div>

                          {/* Teams */}
                          <div className="font-heading text-lg font-bold leading-tight flex items-center gap-2">
                            <TeamLogo logoUrl={match.localTeam.logoUrl} color={match.localTeam.color} name={match.localTeam.name} size="md" />
                            <span>{match.localTeam.shortName}</span>
                            <span className="text-muted-foreground">vs</span>
                            <TeamLogo logoUrl={match.visitorTeam.logoUrl} color={match.visitorTeam.color} name={match.visitorTeam.name} size="md" />
                            <span>{match.visitorTeam.shortName}</span>
                          </div>

                          {/* Score for finished matches */}
                          {match.status === "FINISHED" &&
                            match.localScore !== null &&
                            match.visitorScore !== null && (
                              <p className="font-heading text-xl font-bold text-primary">
                                {match.localScore} — {match.visitorScore}
                              </p>
                            )}

                          {/* Details */}
                          <p className="text-sm text-muted-foreground">
                            {new Date(match.date).toLocaleDateString("es-AR")} —{" "}
                            {match.time}
                            <span className="mx-1.5">·</span>
                            {match.court.venue.name} · {match.court.name}
                            <span className="mx-1.5">·</span>
                            {match.category.name}
                          </p>
                        </div>

                        {/* Right: actions */}
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/admin/matches/${match.id}`}>
                            <Button
                              variant={
                                match.status === "SCHEDULED" ? "default" : "outline"
                              }
                              size="sm"
                            >
                              <Edit className="mr-1.5 h-4 w-4" />
                              {match.status === "SCHEDULED" ? "Cargar" : match.status === "POSTPONED" || match.status === "FINISHED" ? "Editar" : "Ver"}
                            </Button>
                          </Link>
                          {match.status === "SCHEDULED" && (
                            <form action={postponeMatch.bind(null, match.id, slug)}>
                              <Button type="submit" variant="outline" size="sm">
                                <CalendarClock className="mr-1.5 h-4 w-4" />
                                Postergar
                              </Button>
                            </form>
                          )}
                          {match.status === "POSTPONED" && (
                            <form action={rescheduleMatch.bind(null, match.id, slug)}>
                              <Button type="submit" variant="outline" size="sm">
                                <CalendarPlus className="mr-1.5 h-4 w-4" />
                                Reprogramar
                              </Button>
                            </form>
                          )}
                          {(match.status === "SCHEDULED" || match.status === "POSTPONED") && (
                            <DeleteButton
                              action={deleteMatch.bind(null, match.id, slug)}
                              confirmMessage="¿Eliminar este partido?"
                            />
                          )}
                          {(match.status === "SCHEDULED" || match.status === "POSTPONED") && (
                            <SwapRivalsButton
                              matchId={match.id}
                              localName={match.localTeam.shortName}
                              visitorName={match.visitorTeam.shortName}
                              localTeamId={match.localTeam.id}
                              visitorTeamId={match.visitorTeam.id}
                              leagueSlug={slug}
                              candidates={roundMatches
                                .filter(
                                  (m) =>
                                    m.id !== match.id &&
                                    m.categoryId === match.categoryId &&
                                    (m.status === "SCHEDULED" || m.status === "POSTPONED"),
                                )
                                .map((m) => ({
                                  id: m.id,
                                  localName: m.localTeam.shortName,
                                  visitorName: m.visitorTeam.shortName,
                                  localTeamId: m.localTeam.id,
                                  visitorTeamId: m.visitorTeam.id,
                                }))}
                              encounters={matches
                                .filter((m) => m.categoryId === match.categoryId)
                                .map((m) => ({
                                  round: m.round,
                                  localTeamId: m.localTeam.id,
                                  visitorTeamId: m.visitorTeam.id,
                                }))}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {freeTeams.length > 0 && (
                  <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 px-4 py-2 flex flex-wrap items-center gap-2 text-sm">
                    <Badge
                      variant="outline"
                      className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    >
                      Libre
                    </Badge>
                    {freeTeams.map((team) => (
                      <span key={team.id} className="inline-flex items-center gap-1.5">
                        <TeamLogo logoUrl={team.logoUrl} color={team.color} name={team.name} size="sm" />
                        {team.shortName}
                      </span>
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}