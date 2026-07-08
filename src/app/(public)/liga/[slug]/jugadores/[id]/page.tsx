import { notFound } from "next/navigation"
import Link from "next/link"
import db from "@/lib/db"
import { getLeagueBySlug } from "@/lib/get-league"
import {
  ArrowLeft, User, Goal, ShieldAlert, Shirt, Calendar, Fingerprint, Trophy,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/ui/empty-state"
import { TeamLogo } from "@/components/ui/team-logo"

interface Props {
  params: Promise<{ slug: string; id: string }>
}

function calculateAge(birthDate: Date): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export async function generateMetadata({ params }: Props) {
  const { slug, id } = await params
  const league = await getLeagueBySlug(slug)
  const player = await db.player.findUnique({ where: { id }, select: { name: true, surname: true } })
  if (!player || !league) return { title: "Jugador no encontrado" }
  return {
    title: `${player.name} ${player.surname} — ${league.name}`,
    description: `Perfil del jugador ${player.name} ${player.surname}`,
  }
}

export default async function LeaguePlayerProfilePage({ params }: Props) {
  const { slug, id } = await params

  const league = await getLeagueBySlug(slug)
  if (!league) notFound()

  const player = await db.player.findUnique({
    where: { id },
    include: {
      team: { select: { id: true, name: true, shortName: true, color: true, logoUrl: true } },
      goals: {
        where: { match: { status: "FINISHED" } },
        include: {
          match: {
            select: {
              date: true, localTeamId: true, visitorTeamId: true,
              localScore: true, visitorScore: true,
              localTeam: { select: { name: true, shortName: true, color: true, logoUrl: true } },
              visitorTeam: { select: { name: true, shortName: true, color: true, logoUrl: true } },
            },
          },
        },
        orderBy: { match: { date: "desc" } },
      },
      cards: {
        where: { match: { status: "FINISHED" } },
        include: {
          match: {
            select: {
              date: true, localTeamId: true, visitorTeamId: true,
              localScore: true, visitorScore: true,
              localTeam: { select: { name: true, shortName: true, color: true, logoUrl: true } },
              visitorTeam: { select: { name: true, shortName: true, color: true, logoUrl: true } },
            },
          },
        },
        orderBy: { match: { date: "desc" } },
      },
    },
  })

  if (!player) notFound()

  const totalGoals = player.goals.filter((g) => !g.isOwnGoal).length
  const totalYellow = player.cards.filter((c) => c.type === "YELLOW").length
  const totalRed = player.cards.filter((c) => c.type === "RED").length
  const matchIds = new Set([
    ...player.goals.map((g) => g.matchId),
    ...player.cards.map((c) => c.matchId),
  ])
  const matchesPlayed = matchIds.size
  const age = calculateAge(player.birthDate)
  const teamId = player.teamId

  function resolveOpponent(
    matchLocalTeamId: string, matchVisitorTeamId: string,
    localTeam: { name: string; shortName: string; color: string | null; logoUrl: string | null },
    visitorTeam: { name: string; shortName: string; color: string | null; logoUrl: string | null },
  ) {
    return teamId === matchLocalTeamId ? visitorTeam : localTeam
  }

  function formatDate(date: Date): string {
    return date.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })
  }

  return (
    <div className="space-y-8">
      <Link
        href={`/liga/${slug}/goleadores`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <User className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
              {player.name} {player.surname}
            </h1>
            <div className="mt-1 flex items-center gap-2 text-muted-foreground">
              {player.team && (
                <Link
                  href={`/liga/${slug}/equipos/${player.team.id}`}
                  className="flex items-center gap-1.5 transition-colors hover:text-primary hover:underline"
                >
                  <TeamLogo logoUrl={player.team.logoUrl} color={player.team.color} name={player.team.name} size="md" />
                  <span>{player.team.name}</span>
                </Link>
              )}
              {player.jerseyNumber != null && (
                <span className="flex items-center gap-1 text-sm">
                  <Shirt className="h-3.5 w-3.5" />
                  #{player.jerseyNumber}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card size="sm">
          <CardContent className="flex flex-col items-center px-3 py-4 text-center">
            <Fingerprint className="mb-1.5 h-4 w-4 text-muted-foreground" />
            <div className="text-xs text-muted-foreground">DNI</div>
            <div className="mt-0.5 font-mono text-sm font-medium">{player.dni}</div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex flex-col items-center px-3 py-4 text-center">
            <Calendar className="mb-1.5 h-4 w-4 text-muted-foreground" />
            <div className="text-xs text-muted-foreground">Nacimiento</div>
            <div className="mt-0.5 text-sm font-medium">{formatDate(player.birthDate)}</div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex flex-col items-center px-3 py-4 text-center">
            <User className="mb-1.5 h-4 w-4 text-muted-foreground" />
            <div className="text-xs text-muted-foreground">Edad</div>
            <div className="mt-0.5 text-sm font-medium">{age} años</div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex flex-col items-center px-3 py-4 text-center">
            <Shirt className="mb-1.5 h-4 w-4 text-muted-foreground" />
            <div className="text-xs text-muted-foreground">Camiseta</div>
            <div className="mt-0.5 text-sm font-medium">{player.jerseyNumber != null ? `#${player.jerseyNumber}` : "—"}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card size="sm" className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col items-center px-3 py-4 text-center">
            <Goal className="mb-1.5 h-4 w-4 text-primary" />
            <div className="text-xs text-muted-foreground">Goles</div>
            <div className="mt-0.5 text-2xl font-bold text-primary">{totalGoals}</div>
          </CardContent>
        </Card>
        <Card size="sm" className="border-yellow-400/20 bg-yellow-50/50 dark:bg-yellow-900/10">
          <CardContent className="flex flex-col items-center px-3 py-4 text-center">
            <span className="mb-1.5 inline-block h-4 w-3 rounded-sm bg-yellow-400 ring-1 ring-yellow-400/50" />
            <div className="text-xs text-muted-foreground">Amarillas</div>
            <div className="mt-0.5 text-2xl font-bold text-yellow-600 dark:text-yellow-400">{totalYellow}</div>
          </CardContent>
        </Card>
        <Card size="sm" className="border-red-500/20 bg-red-50/50 dark:bg-red-900/10">
          <CardContent className="flex flex-col items-center px-3 py-4 text-center">
            <span className="mb-1.5 inline-block h-4 w-3 rounded-sm bg-red-500 ring-1 ring-red-500/50" />
            <div className="text-xs text-muted-foreground">Rojas</div>
            <div className="mt-0.5 text-2xl font-bold text-red-600 dark:text-red-400">{totalRed}</div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex flex-col items-center px-3 py-4 text-center">
            <Trophy className="mb-1.5 h-4 w-4 text-muted-foreground" />
            <div className="text-xs text-muted-foreground">Partidos</div>
            <div className="mt-0.5 text-2xl font-bold">{matchesPlayed}</div>
          </CardContent>
        </Card>
      </div>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <Goal className="h-5 w-5 text-green-500" />
          <h2 className="font-heading text-xl font-semibold tracking-tight">Goles</h2>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{player.goals.length}</span>
        </div>
        {player.goals.length === 0 ? (
          <EmptyState icon={Goal} title="Sin goles registrados" description="Este jugador aún no ha marcado goles en partidos finalizados." />
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                  <TableHead>Rival</TableHead>
                  <TableHead className="hidden md:table-cell">Marcador</TableHead>
                  <TableHead className="w-16 text-center">Min.</TableHead>
                  <TableHead className="w-20 text-center">Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {player.goals.map((goal) => {
                  const opponent = resolveOpponent(
                    goal.match.localTeamId, goal.match.visitorTeamId,
                    goal.match.localTeam, goal.match.visitorTeam,
                  )
                  return (
                    <TableRow key={goal.id} className="transition-colors hover:bg-muted/40">
                      <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">{formatDate(goal.match.date)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TeamLogo logoUrl={opponent.logoUrl} color={opponent.color} name={opponent.name} size="md" />
                          <span className="font-medium">{opponent.shortName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden font-mono text-sm text-muted-foreground md:table-cell">
                        {goal.match.localScore != null && goal.match.visitorScore != null
                          ? `${goal.match.localScore} – ${goal.match.visitorScore}` : "—"}
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm">{goal.minute}&apos;</TableCell>
                      <TableCell className="text-center">
                        {goal.isOwnGoal ? (
                          <Badge variant="destructive" className="text-[10px]">E/C</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Gol</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-red-500" />
          <h2 className="font-heading text-xl font-semibold tracking-tight">Tarjetas</h2>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{player.cards.length}</span>
        </div>
        {player.cards.length === 0 ? (
          <EmptyState icon={ShieldAlert} title="Sin tarjetas" description="Este jugador no ha recibido tarjetas en partidos finalizados." />
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                  <TableHead>Rival</TableHead>
                  <TableHead className="hidden md:table-cell">Marcador</TableHead>
                  <TableHead className="w-16 text-center">Min.</TableHead>
                  <TableHead className="w-24 text-center">Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {player.cards.map((card) => {
                  const opponent = resolveOpponent(
                    card.match.localTeamId, card.match.visitorTeamId,
                    card.match.localTeam, card.match.visitorTeam,
                  )
                  return (
                    <TableRow key={card.id} className="transition-colors hover:bg-muted/40">
                      <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">{formatDate(card.match.date)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TeamLogo logoUrl={opponent.logoUrl} color={opponent.color} name={opponent.name} size="md" />
                          <span className="font-medium">{opponent.shortName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden font-mono text-sm text-muted-foreground md:table-cell">
                        {card.match.localScore != null && card.match.visitorScore != null
                          ? `${card.match.localScore} – ${card.match.visitorScore}` : "—"}
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm">{card.minute}&apos;</TableCell>
                      <TableCell className="text-center">
                        {card.type === "YELLOW" ? (
                          <Badge variant="outline" className="border-yellow-400 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                            <span className="mr-1 inline-block h-2 w-1.5 rounded-sm bg-yellow-400" />Amarilla
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                            <span className="mr-1 inline-block h-2 w-1.5 rounded-sm bg-red-500" />Roja
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  )
}
