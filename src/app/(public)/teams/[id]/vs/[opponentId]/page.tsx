import { notFound } from "next/navigation"
import Link from "next/link"
import db from "@/lib/db"
import { ArrowLeft, Goal, Swords } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"
import { TeamLogo } from "@/components/ui/team-logo"

export const metadata = {
  title: "Enfrentamiento directo — Torneo Pro",
  description: "Historial completo entre dos equipos",
}

interface PageProps {
  params: Promise<{ id: string; opponentId: string }>
}

export default async function VsPage({ params }: PageProps) {
  const { id, opponentId } = await params

  // 1. Fetch both teams
  const [teamA, teamB] = await Promise.all([
    db.team.findUnique({
      where: { id },
      select: { id: true, name: true, shortName: true, color: true, logoUrl: true, categoryId: true },
    }),
    db.team.findUnique({
      where: { id: opponentId },
      select: { id: true, name: true, shortName: true, color: true, logoUrl: true, categoryId: true },
    }),
  ])

  if (!teamA || !teamB) notFound()

  // Get the league slug for scoped URLs
  const teamCategory = await db.category.findUnique({
    where: { id: teamA.categoryId },
    select: { league: { select: { slug: true } } },
  })
  const leagueSlug = teamCategory?.league?.slug ?? ""

  // 2. Fetch ALL finished matches between these two teams
  const matches = await db.match.findMany({
    where: {
      categoryId: teamA.categoryId,
      status: "FINISHED",
      OR: [
        { localTeamId: id, visitorTeamId: opponentId },
        { localTeamId: opponentId, visitorTeamId: id },
      ],
    },
    include: {
      localTeam: { select: { id: true, name: true, shortName: true, color: true, logoUrl: true } },
      visitorTeam: { select: { id: true, name: true, shortName: true, color: true, logoUrl: true } },
    },
    orderBy: { date: "desc" },
  })

  // 3. Compute head-to-head stats
  const totalMatches = matches.length
  let winsTeamA = 0
  let winsTeamB = 0
  let draws = 0
  let goalsTeamA = 0
  let goalsTeamB = 0

  for (const match of matches) {
    const ls = match.localScore ?? 0
    const vs = match.visitorScore ?? 0

    if (match.localTeamId === id) {
      // Team A is local
      goalsTeamA += ls
      goalsTeamB += vs
      if (ls > vs) winsTeamA++
      else if (ls < vs) winsTeamB++
      else draws++
    } else {
      // Team B is local, Team A is visitor
      goalsTeamA += vs
      goalsTeamB += ls
      if (vs > ls) winsTeamA++
      else if (vs < ls) winsTeamB++
      else draws++
    }
  }

  // 4. Fetch top scorers across all these matches
  const matchIds = matches.map((m) => m.id)
  const topScorerEntries = matchIds.length > 0
    ? await db.goal.groupBy({
        by: ["playerId", "teamId"],
        where: {
          matchId: { in: matchIds },
          isOwnGoal: false,
        },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      })
    : []

  const playerIds = [...new Set(topScorerEntries.map((s) => s.playerId))]
  const scorers = playerIds.length > 0
    ? await db.player.findMany({
        where: { id: { in: playerIds } },
        select: {
          id: true,
          name: true,
          surname: true,
          teamId: true,
          team: { select: { shortName: true, color: true, logoUrl: true } },
        },
      })
    : []

  const scorerMap = new Map(scorers.map((s) => [s.id, s]))

  // Stats bar items — same format as team detail page
  const statItems = [
    { label: "PJ", value: totalMatches },
    { label: `Gana ${teamA.shortName}`, value: winsTeamA, positive: true },
    { label: "Empates", value: draws },
    { label: `Gana ${teamB.shortName}`, value: winsTeamB, negative: true },
    { label: "GF", value: goalsTeamA, teamColor: teamA.color },
    { label: "GC", value: goalsTeamB, teamColor: teamB.color },
  ]

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href={`/liga/${leagueSlug}/equipos/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al equipo
      </Link>

      {/* VS Header */}
      <div className="flex items-center justify-center gap-6 sm:gap-10">
        {/* Team A */}
        <Link
          href={`/liga/${leagueSlug}/equipos/${teamA.id}`}
          className="group flex flex-col items-center gap-2 transition-colors hover:text-primary"
        >
          <TeamLogo logoUrl={teamA.logoUrl} color={teamA.color} name={teamA.name} size="xl" />
          <span className="mt-1 text-center text-lg font-bold tracking-tight group-hover:underline">
            {teamA.shortName}
          </span>
          <span className="text-xs text-muted-foreground">{teamA.name}</span>
        </Link>

        {/* VS badge */}
        <div className="flex items-center justify-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-extrabold tracking-tight text-primary ring-1 ring-primary/20 dark:bg-primary/20 dark:ring-primary/30">
            VS
          </span>
        </div>

        {/* Team B */}
        <Link
          href={`/liga/${leagueSlug}/equipos/${teamB.id}`}
          className="group flex flex-col items-center gap-2 transition-colors hover:text-primary"
        >
          <TeamLogo logoUrl={teamB.logoUrl} color={teamB.color} name={teamB.name} size="xl" />
          <span className="mt-1 text-center text-lg font-bold tracking-tight group-hover:underline">
            {teamB.shortName}
          </span>
          <span className="text-xs text-muted-foreground">{teamB.name}</span>
        </Link>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {statItems.map((item) => (
          <Card key={item.label} size="sm" className="text-center">
            <CardContent className="px-2 py-3">
              <div className="text-xs font-medium text-muted-foreground">{item.label}</div>
              <div
                className={cn(
                  "mt-1 text-lg font-bold tabular-nums",
                  item.positive && "text-green-600 dark:text-green-400",
                  item.negative && "text-red-500 dark:text-red-400",
                  item.teamColor && "text-foreground",
                )}
                style={
                  item.teamColor && !item.positive && !item.negative
                    ? { color: item.teamColor }
                    : undefined
                }
              >
                {item.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Match history */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Swords className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-xl font-semibold tracking-tight">Historial de partidos</h2>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
            {matches.length}
          </span>
        </div>

        {matches.length === 0 ? (
          <EmptyState
            icon={Swords}
            title="Sin enfrentamientos"
            description="Estos equipos aún no se han enfrentado en partidos finalizados."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="hidden sm:table-cell w-24">Fecha</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead className="w-24 text-center">Marcador</TableHead>
                  <TableHead>Visitante</TableHead>
                  <TableHead className="hidden md:table-cell w-16 text-center">Jorn.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((match) => {
                  const localWin = (match.localScore ?? 0) > (match.visitorScore ?? 0)
                  const visitorWin = (match.visitorScore ?? 0) > (match.localScore ?? 0)

                  return (
                    <TableRow key={match.id} className="transition-colors hover:bg-muted/40">
                      <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                        {match.date.toLocaleDateString("es-AR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TeamLogo
                            logoUrl={match.localTeam.logoUrl}
                            color={match.localTeam.color}
                            name={match.localTeam.name}
                            size="md"
                          />
                          <span
                            className={cn(
                              "font-medium",
                              localWin && "font-bold",
                            )}
                          >
                            {match.localTeam.shortName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold tabular-nums">
                        {match.localScore != null && match.visitorScore != null
                          ? `${match.localScore} – ${match.visitorScore}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 justify-end">
                          <span
                            className={cn(
                              "font-medium",
                              visitorWin && "font-bold",
                            )}
                          >
                            {match.visitorTeam.shortName}
                          </span>
                          <TeamLogo
                            logoUrl={match.visitorTeam.logoUrl}
                            color={match.visitorTeam.color}
                            name={match.visitorTeam.name}
                            size="md"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-center text-sm text-muted-foreground md:table-cell">
                        {match.round}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* Top scorers in these matchups */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Goal className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-xl font-semibold tracking-tight">Goleadores del historial</h2>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
            {topScorerEntries.length}
          </span>
        </div>

        {topScorerEntries.length === 0 ? (
          <EmptyState
            icon={Goal}
            title="Sin goles en estos enfrentamientos"
            description="Ningún jugador ha marcado goles en estos partidos."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Jugador</TableHead>
                  <TableHead>Equipo</TableHead>
                  <TableHead className="w-24 text-center">Goles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topScorerEntries.map((entry, idx) => {
                  const player = scorerMap.get(entry.playerId)
                  return (
                    <TableRow
                      key={`${entry.playerId}-${entry.teamId}`}
                      className="transition-colors hover:bg-muted/40"
                    >
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {player?.name ?? "Desconocido"} {player?.surname ?? ""}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TeamLogo
                            logoUrl={player?.team.logoUrl ?? null}
                            color={player?.team.color ?? null}
                            name={player?.team.shortName ?? ""}
                            size="sm"
                          />
                          <span className="text-sm text-muted-foreground">
                            {player?.team.shortName ?? "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center rounded-full bg-primary/15 px-3 py-1 text-sm font-bold text-primary dark:bg-primary/25">
                          {entry._count.id}
                        </span>
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
