import { Suspense } from "react"
import db from "@/lib/db"
import { Calendar, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { MatchScheduleFilter } from "@/components/public/match-schedule-filter"
import { LeagueSelector } from "@/components/ui/league-selector"

export const metadata = {
  title: "Partidos — Liga",
  description: "Calendario de partidos de la liga",
}

const statusConfig = {
  SCHEDULED: { label: "Programado", variant: "secondary" as const },
  PLAYING: { label: "Jugando", variant: "default" as const },
  FINISHED: { label: "Finalizado", variant: "outline" as const },
}

async function MatchesContent({ categoryId, leagueId }: { categoryId?: string; leagueId?: string }) {
  const leagues = await db.league.findMany({
    orderBy: { name: "asc" },
  })

  const categories = await db.category.findMany({
    where: leagueId ? { leagueId } : undefined,
    include: { league: { select: { name: true } } },
    orderBy: { name: "asc" },
  })

  const where: Record<string, unknown> = {}
  if (categoryId) {
    where.categoryId = categoryId
  }
  if (leagueId && !categoryId) {
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
      localTeam: { select: { id: true, name: true, shortName: true, color: true } },
      visitorTeam: { select: { id: true, name: true, shortName: true, color: true } },
      goals: {
        include: {
          player: { select: { name: true, surname: true } },
          team: { select: { id: true, name: true, shortName: true } },
        },
        orderBy: { minute: "asc" },
      },
      cards: {
        include: {
          player: { select: { name: true, surname: true } },
          team: { select: { id: true, name: true, shortName: true } },
        },
        orderBy: { minute: "asc" },
      },
    },
    orderBy: [{ round: "asc" }, { date: "asc" }, { time: "asc" }],
  })

  // Group matches by round
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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Calendario de Partidos
          </h1>
          <p className="mt-1 text-muted-foreground">
            Consultá la programación y resultados de los partidos
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <LeagueSelector leagues={leagues} />
          <MatchScheduleFilter categories={categories} currentCategoryId={categoryId} />
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Calendar className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">
            No hay partidos programados
          </p>
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
                {/* Round heading — "Jornada X" with large primary badge */}
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground shadow-sm">
                    {round}
                  </div>
                  <div>
                    <h2 className="font-heading text-xl font-semibold leading-none">
                      Jornada {round}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {roundMatches.length} partido{roundMatches.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {roundMatches.map((match) => {
                    const status = statusConfig[match.status]
                    const isFinished = match.status === "FINISHED"
                    const isPlaying = match.status === "PLAYING"
                    const matchDate = new Date(match.date)
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    const isToday = matchDate.toDateString() === today.toDateString()

                    return (
                      <div
                        key={match.id}
                        className="group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-primary/30"
                      >
                        {/* Top accent line for live matches */}
                        {isPlaying && (
                          <span className="absolute inset-x-0 top-0 h-1 bg-accent" />
                        )}

                        {/* Match header */}
                        <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2">
                          <Badge variant={status.variant} className="gap-1">
                            {isPlaying && (
                              <Sparkles className="h-3 w-3 animate-pulse" />
                            )}
                            {status.label}
                          </Badge>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {isToday && !isPlaying && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                Hoy
                              </span>
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
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                            <span>·</span>
                            <span>{match.time}</span>
                          </div>
                        </div>

                        {/* Teams & score */}
                        <div className="p-4">
                          <div className="flex items-center justify-between gap-3">
                            {/* Local team */}
                            <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
                              <span
                                className="inline-block h-3 w-3 rounded-full ring-2 ring-black/5 transition-transform group-hover:scale-110"
                                style={{ backgroundColor: match.localTeam.color || "var(--primary)" }}
                              />
                              <span className="text-sm font-semibold leading-tight">
                                {match.localTeam.shortName}
                              </span>
                            </div>

                            {/* Score */}
                            <div className="flex items-center gap-2">
                              {isFinished &&
                              match.localScore !== null &&
                              match.visitorScore !== null ? (
                                <span className="text-2xl font-bold tabular-nums tracking-tight">
                                  <span className="text-primary">
                                    {match.localScore}
                                  </span>
                                  <span className="mx-1.5 text-muted-foreground/50">-</span>
                                  <span className="text-primary">
                                    {match.visitorScore}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-lg font-medium text-muted-foreground/40">
                                  vs
                                </span>
                              )}
                            </div>

                            {/* Visitor team */}
                            <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
                              <span
                                className="inline-block h-3 w-3 rounded-full ring-2 ring-black/5 transition-transform group-hover:scale-110"
                                style={{ backgroundColor: match.visitorTeam.color || "var(--primary)" }}
                              />
                              <span className="text-sm font-semibold leading-tight">
                                {match.visitorTeam.shortName}
                              </span>
                            </div>
                          </div>

                          {/* Extra info */}
                          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                            <span>{match.court.name}</span>
                            <span>·</span>
                            <span>{match.category.name}</span>
                          </div>

                          {/* Goals & cards (only for finished matches) */}
                          {isFinished && (match.goals.length > 0 || match.cards.length > 0) && (
                            <div className="mt-3 space-y-1.5 border-t pt-3">
                              {match.goals.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                                    Goles
                                  </p>
                                  {match.goals.map((goal) => {
                    const isLocal = goal.teamId === match.localTeam.id
                    return (
                      <div
                        key={goal.id}
                        className="flex items-center gap-1.5 text-xs"
                      >
                        <span
                          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px]"
                          style={{ backgroundColor: isLocal ? (match.localTeam.color || "var(--primary)") : (match.visitorTeam.color || "#64748b") }}
                        >
                          ⚽
                        </span>
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: isLocal ? (match.localTeam.color || "var(--primary)") : (match.visitorTeam.color || "#64748b") }}
                        />
                        <span className="shrink-0 text-[10px] font-semibold text-muted-foreground">
                          {goal.team.shortName}
                        </span>
                        <span className="font-medium">
                          {goal.player.name} {goal.player.surname}
                        </span>
                        {goal.isOwnGoal && (
                          <span className="rounded bg-destructive/10 px-1 py-0.5 text-[10px] text-destructive">
                            e/c
                          </span>
                        )}
                        <span className="text-muted-foreground">
                          {goal.minute}&apos;
                        </span>
                      </div>
                    )
                  })}
                                </div>
                              )}
                              {match.cards.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                                    Tarjetas
                                  </p>
                                  {match.cards.map((card) => {
                                    const isLocal = card.teamId === match.localTeam.id
                                    const isDoubleYellowRed = card.type === "RED" && card.isSecondYellow
                                    return (
                                      <div
                                        key={card.id}
                                        className="flex items-center gap-1.5 text-xs"
                                      >
                                        {isDoubleYellowRed ? (
                                          <>
                                            <span className="inline-block h-2.5 w-1.5 rounded-sm bg-yellow-400" />
                                            <span className="inline-block h-2.5 w-1.5 rounded-sm bg-red-500 -ml-0.5" />
                                          </>
                                        ) : (
                                          <span
                                            className={`inline-block h-2.5 w-1.5 rounded-sm ${
                                              card.type === "YELLOW"
                                                ? "bg-yellow-400"
                                                : "bg-red-500"
                                            }`}
                                          />
                                        )}
                                        <span
                                          className="inline-block h-1.5 w-1.5 rounded-full"
                                          style={{ backgroundColor: isLocal ? (match.localTeam.color || "var(--primary)") : (match.visitorTeam.color || "#64748b") }}
                                        />
                                        <span className="shrink-0 text-[10px] font-semibold text-muted-foreground">
                                          {card.team.shortName}
                                        </span>
                                        <span className="font-medium">
                                          {card.player.name} {card.player.surname}
                                        </span>
                                        {isDoubleYellowRed && (
                                          <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                            2A
                                          </span>
                                        )}
                                        <span className="text-muted-foreground">
                                          {card.minute}&apos;
                                        </span>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default async function PublicMatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string; leagueId?: string }>
}) {
  const { categoryId, leagueId } = await searchParams

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <MatchesContent categoryId={categoryId} leagueId={leagueId} />
    </Suspense>
  )
}
