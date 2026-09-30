"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import type { Prisma } from "@prisma/client"
import { Calendar, Sparkles, List, Megaphone } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { MatchScheduleFilter } from "@/components/public/match-schedule-filter"
import { MatchRoundFilter } from "@/components/public/match-round-filter"
import { buildScheduleHref, parseFechaParam } from "@/lib/schedule-params"
import { cn } from "@/lib/utils"
import { TeamLogo } from "@/components/ui/team-logo"
import { GoalBall, CardIcon } from "@/components/ui/card-icons"
import { CourtMapLink } from "@/components/ui/court-map-link"

type MatchWithRefs = Prisma.MatchGetPayload<{
  include: {
    category: { select: { name: true } }
    court: { select: { name: true, venue: { select: { name: true, address: true, city: true, googleMapsLink: true } } } }
    localTeam: { select: { id: true, name: true, shortName: true, color: true, logoUrl: true } }
    visitorTeam: { select: { id: true, name: true, shortName: true, color: true, logoUrl: true } }
  }
}>
type GoalWithRefs = Prisma.GoalGetPayload<{
  include: {
    player: { select: { name: true; surname: true } }
    team: { select: { id: true; name: true; shortName: true; color: true; logoUrl: true } }
  }
}>
type CardWithRefs = Prisma.CardGetPayload<{
  include: {
    player: { select: { name: true; surname: true } }
    team: { select: { id: true; name: true; shortName: true; color: true; logoUrl: true } }
  }
}>

interface MatchScheduleViewProps {
  slug: string
  leagueName: string
  season: string
  categories: { id: string; name: string; league: { name: string } }[]
  matches: MatchWithRefs[]
  goalsByMatch: Record<string, GoalWithRefs[]>
  cardsByMatch: Record<string, CardWithRefs[]>
  teams: { id: string; name: string; shortName: string; color: string | null; logoUrl: string | null; categoryId: string }[]
  hiddenRoundKeys: string[]
  roundNotifications: { categoryId: string; round: number; message: string }[]
  availableFechas: number[]
  initialCategoryId?: string
  initialFecha?: number
}

const statusConfig = {
  SCHEDULED: { label: "Programado", variant: "secondary" as const },
  PLAYING: { label: "Jugando", variant: "default" as const },
  FINISHED: { label: "Finalizado", variant: "outline" as const },
  POSTPONED: { label: "Postergado", variant: "outline" as const },
}

export function MatchScheduleView({
  slug,
  leagueName,
  season,
  categories,
  matches,
  goalsByMatch,
  cardsByMatch,
  teams,
  hiddenRoundKeys,
  roundNotifications,
  availableFechas,
  initialCategoryId,
  initialFecha,
}: MatchScheduleViewProps) {
  const [categoryId, setCategoryId] = useState<string | undefined>(initialCategoryId)
  const [fecha, setFecha] = useState<number | undefined>(initialFecha)

  const basePath = `/liga/${slug}/partidos`

  // Mantener la URL sincronizada sin navegar al servidor (clics instantáneos).
  function syncUrl(nextCategoryId: string | undefined, nextFecha: number | undefined) {
    window.history.pushState({ categoryId: nextCategoryId, fecha: nextFecha }, "", buildScheduleHref(basePath, { categoryId: nextCategoryId, fecha: nextFecha }))
  }

  function handleCategorySelect(catId: string | null) {
    const next = catId ?? undefined
    setCategoryId(next)
    syncUrl(next, fecha)
  }

  function handleFechaSelect(nextFecha: number | null) {
    const next = nextFecha ?? undefined
    setFecha(next)
    syncUrl(categoryId, next)
  }

  useEffect(() => {
    function onPop() {
      const params = new URLSearchParams(window.location.search)
      setCategoryId(params.get("categoryId") ?? undefined)
      setFecha(parseFechaParam(params.get("fecha")))
    }
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  const hiddenKeySet = useMemo(() => new Set(hiddenRoundKeys), [hiddenRoundKeys])

  const visibleMatches = useMemo(
    () =>
      matches
        .filter((match) => !hiddenKeySet.has(`${match.categoryId}:${match.round}`))
        .filter((match) => !categoryId || match.categoryId === categoryId)
        .filter((match) => fecha === undefined || match.round === fecha),
    [matches, hiddenKeySet, categoryId, fecha],
  )

  const categoryNameById = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  )

  const roundNotificationMap = useMemo(
    () => new Map(roundNotifications.map((n) => [`${n.categoryId}:${n.round}`, n.message])),
    [roundNotifications],
  )

  const playedByCategoryRound = useMemo(() => {
    const map = new Map<string, Map<number, Set<string>>>()
    for (const match of visibleMatches) {
      if (!map.has(match.categoryId)) {
        map.set(match.categoryId, new Map())
      }
      const roundMap = map.get(match.categoryId)!
      if (!roundMap.has(match.round)) {
        roundMap.set(match.round, new Set())
      }
      roundMap.get(match.round)!.add(match.localTeamId)
      roundMap.get(match.round)!.add(match.visitorTeamId)
    }
    return map
  }, [visibleMatches])

  const groupedByRound = useMemo(() => {
    const acc = {} as Record<number, MatchWithRefs[]>
    for (const match of visibleMatches) {
      const round = match.round
      if (!acc[round]) acc[round] = []
      acc[round].push(match)
    }
    return acc
  }, [visibleMatches])

  const rounds = useMemo(
    () => Object.keys(groupedByRound).map(Number).sort((a, b) => a - b),
    [groupedByRound],
  )

  const freeTeamsByRound = useMemo(() => {
    const map = new Map<number, typeof teams>()
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
        map.set(round, freeTeams)
      }
    }
    return map
  }, [rounds, groupedByRound, teams, playedByCategoryRound])

  const selectedCategory = categoryId
    ? categories.find((c) => c.id === categoryId)
    : undefined

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            {leagueName} — Partidos
          </h1>
          <p className="mt-1 text-muted-foreground">
            Temporada {season} &middot; Programación y resultados
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <MatchScheduleFilter
            categories={categories}
            currentCategoryId={categoryId}
            leagueSlug={slug}
            onSelect={handleCategorySelect}
          />
          <MatchRoundFilter
            leagueSlug={slug}
            fechas={availableFechas}
            currentFecha={fecha}
            categoryId={categoryId}
            onSelect={handleFechaSelect}
          />
        </div>
      </div>

      <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-0.5 w-fit print:hidden">
        <Link
          href={buildScheduleHref(`/liga/${slug}/partidos`, { categoryId, fecha })}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            "bg-background text-foreground shadow-sm",
          )}
        >
          <List className="h-4 w-4" />
          Lista
        </Link>
        <Link
          href={buildScheduleHref(`/liga/${slug}/calendario`, { categoryId, fecha })}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Calendar className="h-4 w-4" />
          Calendario
        </Link>
      </div>

      {visibleMatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Calendar className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">
            {fecha !== undefined ? `No hay partidos en la Fecha ${fecha}` : "No hay partidos programados"}
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
            const freeTeams = freeTeamsByRound.get(round) ?? []
            const catsInRound = Array.from(
              new Map(roundMatches.map((m) => [m.categoryId, m.category.name])).entries(),
            )
            const roundNotifications = catsInRound
              .map(([categoryId, name]) => ({
                categoryId,
                name,
                message: roundNotificationMap.get(`${categoryId}:${round}`),
              }))
              .filter((n) => Boolean(n.message))
            return (
              <section key={round}>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground shadow-sm">
                    {round}
                  </div>
                  <div>
                    <h2 className="font-heading text-xl font-semibold leading-none">Fecha {round}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {roundMatches.length} partido{roundMatches.length !== 1 ? "s" : ""}
                      {freeTeams.length > 0 &&
                        ` · ${freeTeams.length} equipo${freeTeams.length !== 1 ? "s" : ""} libre${freeTeams.length !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                </div>

                {roundNotifications.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {roundNotifications.map((notification) => (
                      <div
                        key={notification.categoryId}
                        className="flex items-start gap-3 rounded-xl border border-l-[3px] border-l-amber-500/70 bg-card p-4 shadow-sm"
                      >
                        <Megaphone className="mt-0.5 h-4 w-4 shrink-0 animate-pulse text-destructive" />
                        <div className="animate-pulse text-base">
                          {catsInRound.length > 1 && (
                            <p className="mb-0.5 text-xs font-semibold text-muted-foreground">
                              {categoryNameById.get(notification.categoryId)}
                            </p>
                          )}
                          <p className="whitespace-pre-line">{notification.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-1">
                  {roundMatches.map((match) => {
                    const status = statusConfig[match.status]
                    const isFinished = match.status === "FINISHED"
                    const isPlaying = match.status === "PLAYING"
                    const matchDate = new Date(match.date)
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    const isToday = matchDate.toDateString() === today.toDateString()
                    const matchGoals = goalsByMatch[match.id] ?? []
                    const matchCards = cardsByMatch[match.id] ?? []

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
                          <Badge
                            variant={status.variant}
                            className={
                              match.status === "POSTPONED"
                                ? "gap-1 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                : "gap-1"
                            }
                          >
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
                            {(() => {
                              const mapsHref = match.court.venue.googleMapsLink || (match.court.venue.address
                                ? `https://www.google.com/maps/search/${encodeURIComponent([match.court.venue.address, match.court.venue.city, "Argentina"].filter(Boolean).join(", "))}`
                                : null)
                              return mapsHref ? (
                                <CourtMapLink href={mapsHref} name={`${match.court.venue.name} · ${match.court.name}`} />
                              ) : (
                                <span>{match.court.venue.name} · {match.court.name}</span>
                              )
                            })()}
                            <span>&middot;</span>
                            <span>{match.category.name}</span>
                          </div>

                          {isFinished && (matchGoals.length > 0 || matchCards.length > 0) && (
                            <div className="mt-3 space-y-1.5 border-t pt-3">
                              {matchGoals.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Goles</p>
                                  {matchGoals.map((goal) => {
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
                              {matchCards.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Tarjetas</p>
                                  {matchCards.map((card) => {
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

                  {freeTeams.map((team) => (
                    <div
                      key={team.id}
                      className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 p-4 text-center"
                    >
                      <Badge
                        variant="outline"
                        className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      >
                        Libre
                      </Badge>
                      <TeamLogo logoUrl={team.logoUrl} color={team.color} name={team.name} size="md" />
                      <span className="text-sm font-semibold leading-tight">{team.shortName}</span>
                      <span className="text-xs text-muted-foreground">
                        Sin partido esta fecha · {categoryNameById.get(team.categoryId)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}