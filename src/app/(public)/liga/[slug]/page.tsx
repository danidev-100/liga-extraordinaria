import Link from "next/link"
import { notFound } from "next/navigation"
import db from "@/lib/db"
import { getLeagueBySlug } from "@/lib/get-league"
import {
  Trophy, Users, Calendar, Goal, ShieldAlert, ListOrdered,
  MapPin, Clock, CheckCircle2, ArrowRight, UserRound,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TeamLogo } from "@/components/ui/team-logo"
import { cn } from "@/lib/utils"

interface Props {
  params: Promise<{ slug: string }>
}

const statusConfig = {
  SCHEDULED: { label: "Programado", variant: "secondary" as const },
  PLAYING: { label: "En Vivo", variant: "default" as const },
  FINISHED: { label: "Finalizado", variant: "outline" as const },
}

export default async function LeagueHomePage({ params }: Props) {
  const { slug } = await params

  const league = await getLeagueBySlug(slug)
  if (!league) notFound()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    categoryCount,
    teamCount,
    playerCount,
    matchCount,
    finishedCount,
    upcomingMatches,
    recentResults,
    standingsData,
  ] = await Promise.all([
    db.category.count({ where: { leagueId: league.id } }),
    db.team.count({ where: { category: { leagueId: league.id } } }),
    db.player.count({ where: { team: { category: { leagueId: league.id } } } }),
    db.match.count({ where: { category: { leagueId: league.id } } }),
    db.match.count({ where: { category: { leagueId: league.id }, status: "FINISHED" } }),
    db.match.findMany({
      where: { category: { leagueId: league.id }, date: { gte: today }, status: "SCHEDULED" },
      take: 5,
      orderBy: [{ date: "asc" }, { time: "asc" }],
      include: {
        category: { select: { name: true } },
        court: { select: { name: true } },
        localTeam: { select: { id: true, name: true, shortName: true, logoUrl: true, color: true } },
        visitorTeam: { select: { id: true, name: true, shortName: true, logoUrl: true, color: true } },
      },
    }),
    db.match.findMany({
      where: { category: { leagueId: league.id }, status: "FINISHED" },
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: {
        category: { select: { name: true } },
        localTeam: { select: { id: true, name: true, shortName: true, logoUrl: true, color: true } },
        visitorTeam: { select: { id: true, name: true, shortName: true, logoUrl: true, color: true } },
      },
    }),
    db.standing.findMany({
      where: { team: { category: { leagueId: league.id } } },
      take: 5,
      orderBy: [{ position: "asc" }],
      include: {
        team: { select: { id: true, name: true, shortName: true, logoUrl: true, color: true, categoryId: true } },
      },
    }),
  ])

  const navCards = [
    { label: "Partidos", href: `/liga/${slug}/partidos`, icon: Calendar, count: matchCount, color: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950/40" },
    { label: "Equipos", href: `/liga/${slug}/equipos`, icon: Users, count: teamCount, color: "text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/40" },
    { label: "Posiciones", href: `/liga/${slug}/posiciones`, icon: ListOrdered, color: "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-950/40" },
    { label: "Goleadores", href: `/liga/${slug}/goleadores`, icon: Goal, color: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-950/40" },
    { label: "Tarjetas", href: `/liga/${slug}/tarjetas`, icon: ShieldAlert, color: "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-950/40" },
  ]

  function formatDate(d: Date) {
    return new Date(d).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
              {league.name}
            </h1>
            <Badge variant={league.isActive ? "default" : "secondary"} className="h-6">
              {league.isActive ? "Activa" : "Inactiva"}
            </Badge>
          </div>
          <p className="mt-1 text-muted-foreground">
            Temporada {league.season} · {categoryCount} categoría{categoryCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-l-4 border-l-primary bg-card/70 backdrop-blur-xl shadow-xl transition-transform duration-200 hover:scale-[1.02]">
          <CardContent className="flex items-center justify-between pt-5">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Equipos</p>
              <p className="mt-0.5 text-2xl font-bold font-heading">{teamCount}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500 bg-card/70 backdrop-blur-xl shadow-xl transition-transform duration-200 hover:scale-[1.02]">
          <CardContent className="flex items-center justify-between pt-5">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Jugadores</p>
              <p className="mt-0.5 text-2xl font-bold font-heading">{playerCount}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <UserRound className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500 bg-card/70 backdrop-blur-xl shadow-xl transition-transform duration-200 hover:scale-[1.02]">
          <CardContent className="flex items-center justify-between pt-5">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Partidos</p>
              <p className="mt-0.5 text-2xl font-bold font-heading">{matchCount}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Calendar className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500 bg-card/70 backdrop-blur-xl shadow-xl transition-transform duration-200 hover:scale-[1.02]">
          <CardContent className="flex items-center justify-between pt-5">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Finalizados</p>
              <p className="mt-0.5 text-2xl font-bold font-heading">{finishedCount}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nav cards grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {navCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-xl border bg-card/70 backdrop-blur-xl p-4 shadow-lg transition-all duration-200 hover:scale-[1.03] hover:shadow-xl hover:ring-2 hover:ring-primary/20"
          >
            <div className={cn("mb-3 inline-flex rounded-lg p-2.5", card.color)}>
              <card.icon className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold">{card.label}</p>
            {card.count !== undefined && (
              <p className="mt-0.5 text-xs text-muted-foreground">{card.count} totales</p>
            )}
          </Link>
        ))}
      </div>

      {/* Recent + Upcoming */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent results */}
        <Card className="bg-card/70 backdrop-blur-xl shadow-xl transition-transform duration-200 hover:scale-[1.01]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Últimos resultados</CardTitle>
            <Link href={`/liga/${slug}/partidos`} className="text-xs text-primary hover:underline">
              Ver todos <ArrowRight className="ml-0.5 inline h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentResults.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No hay resultados aún</p>
            ) : (
              <div className="space-y-2">
                {recentResults.map((m) => (
                  <Link
                    key={m.id}
                    href={`/liga/${slug}/partidos/${m.id}`}
                    className="flex items-center rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted"
                  >
                    <div className="flex flex-1 items-center justify-end gap-2 min-w-0">
                      <span className="truncate font-medium text-right">{m.localTeam.shortName}</span>
                      <TeamLogo logoUrl={m.localTeam.logoUrl} color={m.localTeam.color} name={m.localTeam.name} size="sm" />
                    </div>
                    <span className={cn(
                      "mx-3 w-14 text-center shrink-0 font-bold tabular-nums",
                      m.localScore !== null && m.visitorScore !== null && "text-primary",
                    )}>
                      {m.localScore !== null ? `${m.localScore}–${m.visitorScore}` : "vs"}
                    </span>
                    <div className="flex flex-1 items-center gap-2 min-w-0">
                      <TeamLogo logoUrl={m.visitorTeam.logoUrl} color={m.visitorTeam.color} name={m.visitorTeam.name} size="sm" />
                      <span className="truncate font-medium">{m.visitorTeam.shortName}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming matches */}
        <Card className="bg-card/70 backdrop-blur-xl shadow-xl transition-transform duration-200 hover:scale-[1.01]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Próximos partidos</CardTitle>
            <Link href={`/liga/${slug}/partidos`} className="text-xs text-primary hover:underline">
              Ver todos <ArrowRight className="ml-0.5 inline h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingMatches.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No hay partidos programados</p>
            ) : (
              <div className="space-y-2">
                {upcomingMatches.map((m) => (
                  <Link
                    key={m.id}
                    href={`/liga/${slug}/partidos/${m.id}`}
                    className="flex items-center rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted"
                  >
                    <div className="flex flex-1 items-center justify-end gap-2 min-w-0">
                      <span className="truncate font-medium text-right">{m.localTeam.shortName}</span>
                      <TeamLogo logoUrl={m.localTeam.logoUrl} color={m.localTeam.color} name={m.localTeam.name} size="sm" />
                    </div>
                    <div className="mx-3 w-14 shrink-0 text-center">
                      <span className="text-xs text-muted-foreground">vs</span>
                      <p className="text-[10px] text-muted-foreground">{formatDate(m.date)}</p>
                    </div>
                    <div className="flex flex-1 items-center gap-2 min-w-0">
                      <TeamLogo logoUrl={m.visitorTeam.logoUrl} color={m.visitorTeam.color} name={m.visitorTeam.name} size="sm" />
                      <span className="truncate font-medium">{m.visitorTeam.shortName}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Standings top 5 */}
      {standingsData.length > 0 && (
        <Card className="bg-card/70 backdrop-blur-xl shadow-xl transition-transform duration-200 hover:scale-[1.01]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Tabla de posiciones</CardTitle>
            <Link href={`/liga/${slug}/posiciones`} className="text-xs text-primary hover:underline">
              Ver completa <ArrowRight className="ml-0.5 inline h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-xs font-medium text-muted-foreground">
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Equipo</th>
                    <th className="px-3 py-2 text-center">PJ</th>
                    <th className="px-3 py-2 text-center">G</th>
                    <th className="px-3 py-2 text-center">E</th>
                    <th className="px-3 py-2 text-center">P</th>
                    <th className="px-3 py-2 text-center">DG</th>
                    <th className="px-3 py-2 text-right font-bold">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standingsData.map((s, i) => (
                    <tr key={s.teamId} className={cn(
                      "border-t transition-colors hover:bg-muted/30",
                      i < 3 && "bg-primary/[0.02]",
                    )}>
                      <td className="px-3 py-2">
                        <span className={cn(
                          "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                          i === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                          i === 1 ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" :
                          i === 2 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                          "bg-muted text-muted-foreground",
                        )}>
                          {s.position}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <TeamLogo logoUrl={s.team.logoUrl} color={s.team.color} name={s.team.name} size="sm" />
                          <span className="font-medium">{s.team.shortName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center tabular-nums">{s.pj}</td>
                      <td className="px-3 py-2 text-center tabular-nums">{s.pg}</td>
                      <td className="px-3 py-2 text-center tabular-nums">{s.pe}</td>
                      <td className="px-3 py-2 text-center tabular-nums">{s.pp}</td>
                      <td className={cn(
                        "px-3 py-2 text-center tabular-nums",
                        s.dg > 0 ? "text-green-600" : s.dg < 0 ? "text-red-600" : "",
                      )}>
                        {s.dg > 0 ? `+${s.dg}` : s.dg}
                      </td>
                      <td className="px-3 py-2 text-right font-bold tabular-nums">{s.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
