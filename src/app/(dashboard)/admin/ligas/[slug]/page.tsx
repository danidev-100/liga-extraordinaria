import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ensureScope } from "@/lib/ensure-scope"
import db from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Trophy,
  Users,
  Shield,
  Calendar,
  MapPin,
  CircleDot,
  Plus,
  ClipboardList,
  ArrowRight,
  Clock,
  CheckCircle2,
  Play,
  Swords,
  UserRound,
  CalendarClock,
  CalendarPlus,
} from "lucide-react"
import Link from "next/link"
import { TeamLogo } from "@/components/ui/team-logo"
import {
  getGoalsDistribution,
  getLeastConceded,
  getCardsBreakdown,
  getFormTrend,
  getTopScorers,
} from "@/lib/analytics"
import { getCategories } from "@/actions/analytics"
import { ChartSection } from "@/components/charts/chart-section"

interface Props {
  params: Promise<{ slug: string }>
}

const statusConfig = {
  SCHEDULED: { label: "Programado", variant: "secondary" as const, icon: Clock },
  PLAYING: { label: "Jugando", variant: "default" as const, icon: Play },
  FINISHED: { label: "Finalizado", variant: "outline" as const, icon: CheckCircle2 },
}

export default async function LeagueDashboardPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { slug } = await params
  const { leagueId } = await ensureScope(slug)

  const league = await db.league.findUnique({ where: { slug } })
  if (!league) redirect("/admin")

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const [
    categoryCount, teamCount, playerCount,
    courtCount, matchCount, finishedCount, todayMatchCount,
    pendingMatchCount, recentMatches,
  ] = await Promise.all([
    db.category.count({ where: { leagueId } }),
    db.team.count({ where: { category: { leagueId } } }),
    db.player.count({ where: { team: { category: { leagueId } } } }),
    db.court.count(),
    db.match.count({ where: { category: { leagueId } } }),
    db.match.count({ where: { category: { leagueId }, status: "FINISHED" } }),
    db.match.count({ where: { category: { leagueId }, date: { gte: todayStart, lte: todayEnd } } }),
    db.match.count({ where: { category: { leagueId }, status: "SCHEDULED" } }),
    db.match.findMany({
      where: { category: { leagueId } },
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: {
        category: { select: { name: true } },
        localTeam: { select: { shortName: true, name: true, color: true, logoUrl: true } },
        visitorTeam: { select: { shortName: true, name: true, color: true, logoUrl: true } },
      },
    }),
  ])

  const [
    goalsData,
    concededData,
    cardsData,
    formTrendData,
    topScorersData,
    categories,
  ] = await Promise.all([
    getGoalsDistribution(leagueId),
    getLeastConceded(leagueId),
    getCardsBreakdown(leagueId),
    getFormTrend(undefined, leagueId),
    getTopScorers(5, leagueId),
    getCategories(leagueId),
  ])

  const summaryCards = [
    {
      title: "Equipos",
      value: teamCount,
      icon: Users,
      subtitle: "totales",
    },
    {
      title: "Jugadores",
      value: playerCount,
      icon: UserRound,
      subtitle: "totales",
    },
    {
      title: "Partidos Hoy",
      value: todayMatchCount,
      icon: CalendarClock,
      subtitle: "programados",
    },
    {
      title: "Pendientes",
      value: pendingMatchCount,
      icon: CalendarPlus,
      subtitle: "por jugar",
    },
  ]

  const navCards = [
    {
      title: "Categorías",
      value: categoryCount,
      icon: Shield,
      href: `/admin/ligas/${slug}/categories`,
    },
    {
      title: "Equipos",
      value: teamCount,
      icon: Users,
      href: `/admin/ligas/${slug}/teams`,
    },
    {
      title: "Jugadores",
      value: playerCount,
      icon: CircleDot,
      href: `/admin/ligas/${slug}/players`,
    },
    {
      title: "Canchas",
      value: courtCount,
      icon: MapPin,
      href: `/admin/ligas/${slug}/courts`,
    },
    {
      title: "Partidos",
      value: matchCount,
      icon: Calendar,
      href: `/admin/ligas/${slug}/matches`,
      badge: `${finishedCount} finalizados`,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-heading">{league.name}</h1>
          <p className="text-muted-foreground">
            Panel de administración — Temporada {league.season} · Bienvenido, {session?.user?.name ?? "Administrador"}
          </p>
        </div>
      </div>

      {/* Hero summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className="border-l-4 border-l-primary shadow-xs">
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <p className="mt-1 text-3xl font-bold tracking-tight font-heading">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.subtitle}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <card.icon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Nav stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {navCards.map((card) => (
          <Link key={card.title} href={card.href} className="group">
            <Card className="transition-all duration-200 hover:shadow-md hover:ring-2 hover:ring-primary/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <div className="rounded-lg bg-muted p-1.5 text-muted-foreground group-hover:text-primary transition-colors">
                  <card.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading">{card.value}</div>
                {card.badge && (
                  <p className="mt-1 text-xs text-muted-foreground">{card.badge}</p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick actions + Recent matches */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick actions */}
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle>Acciones rápidas</CardTitle>
            <CardDescription>
              Atajos para las tareas más comunes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link href={`/admin/ligas/${slug}/matches/new`}>
                <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4 transition-all hover:border-primary/40 hover:bg-primary/5">
                  <Plus className="h-5 w-5 text-primary" />
                  <span className="text-xs font-medium">Nuevo Partido</span>
                </Button>
              </Link>
              <Link href={`/admin/ligas/${slug}/players/new`}>
                <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4 transition-all hover:border-primary/40 hover:bg-primary/5">
                  <UserRound className="h-5 w-5 text-primary" />
                  <span className="text-xs font-medium">Nuevo Jugador</span>
                </Button>
              </Link>
              <Link href={`/admin/ligas/${slug}/teams/new`}>
                <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4 transition-all hover:border-primary/40 hover:bg-primary/5">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="text-xs font-medium">Nuevo Equipo</span>
                </Button>
              </Link>
              <Link href={`/admin/ligas/${slug}/standings`}>
                <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4 transition-all hover:border-primary/40 hover:bg-primary/5">
                  <Swords className="h-5 w-5 text-primary" />
                  <span className="text-xs font-medium">Ver Posiciones</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent matches */}
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Partidos recientes</CardTitle>
              <CardDescription>
                Últimos partidos actualizados
              </CardDescription>
            </div>
            <Link href={`/admin/ligas/${slug}/matches`}>
              <Button variant="ghost" size="sm" className="gap-1 text-primary">
                <span className="text-xs">Ver todos</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentMatches.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No hay partidos registrados aún.
                <br />
                <Link
                  href={`/admin/ligas/${slug}/matches/new`}
                  className="mt-1 inline-block text-primary hover:underline"
                >
                  Crear el primer partido
                </Link>
              </p>
            ) : (
              <div className="space-y-2">
                {recentMatches.map((match) => {
                  const status = statusConfig[match.status]
                  const isFinished = match.status === "FINISHED"

                  return (
                    <Link
                      key={match.id}
                      href={`/admin/ligas/${slug}/matches/${match.id}`}
                      className="flex items-center justify-between rounded-lg border bg-card px-4 py-2.5 transition-all hover:bg-muted hover:border-primary/20"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant={status.variant} className="gap-1 text-[10px]">
                          {status.label}
                        </Badge>
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                          <TeamLogo logoUrl={match.localTeam.logoUrl} color={match.localTeam.color} name={match.localTeam.name} size="md" />
                          <span>{match.localTeam.shortName}</span>
                          {isFinished && match.localScore !== null && match.visitorScore !== null ? (
                            <span className="mx-1 font-bold text-primary">
                              {match.localScore}-{match.visitorScore}
                            </span>
                          ) : (
                            <span className="mx-0.5 text-xs text-muted-foreground">vs</span>
                          )}
                          <TeamLogo logoUrl={match.visitorTeam.logoUrl} color={match.visitorTeam.color} name={match.visitorTeam.name} size="md" />
                          <span>{match.visitorTeam.shortName}</span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {match.category.name}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <ChartSection
        goalsData={goalsData}
        concededData={concededData}
        cardsData={cardsData}
        formTrendData={formTrendData}
        topScorersData={topScorersData}
        categories={categories}
      />
    </div>
  )
}
