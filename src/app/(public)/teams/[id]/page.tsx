import { notFound } from "next/navigation"
import Link from "next/link"
import db from "@/lib/db"
import {
  ArrowLeft,
  Users,
  Swords,
  Goal,
  Trophy,
  Hash,
  Calendar,
  Shirt,
  AlertTriangle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  title: "Equipo — Liga",
  description: "Detalle del equipo",
}

interface PageProps {
  params: Promise<{ id: string }>
}

const resultBadge = (result: string) => {
  if (result === "W") return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
  if (result === "D") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
  return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
}

const resultLabel: Record<string, string> = {
  W: "G",
  D: "E",
  L: "P",
}

export default async function TeamDetailPage({ params }: PageProps) {
  const { id } = await params

  // 1. Fetch team with category, players, and standing
  const team = await db.team.findUnique({
    where: { id },
    include: {
      category: { select: { name: true, league: { select: { name: true } } } },
      players: {
        where: { isActive: true },
        orderBy: [{ jerseyNumber: "asc" }, { surname: "asc" }],
        select: { id: true, name: true, surname: true, jerseyNumber: true, birthDate: true },
      },
      standing: true,
    },
  })

  if (!team) notFound()

  // 2. Fetch finished matches for this team
  const matches = await db.match.findMany({
    where: {
      categoryId: team.categoryId,
      status: "FINISHED",
      OR: [{ localTeamId: id }, { visitorTeamId: id }],
    },
    include: {
      localTeam: { select: { id: true, name: true, shortName: true, color: true, logoUrl: true } },
      visitorTeam: { select: { id: true, name: true, shortName: true, color: true, logoUrl: true } },
    },
    orderBy: { date: "desc" },
    take: 20,
  })

  // 3. Fetch top 10 scorers for this team
  const topScorersRaw = await db.goal.groupBy({
    by: ["playerId"],
    where: { teamId: id, match: { status: "FINISHED" }, isOwnGoal: false },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  })

  let scorers: { id: string; name: string; surname: string }[] = []
  if (topScorersRaw.length > 0) {
    scorers = await db.player.findMany({
      where: { id: { in: topScorersRaw.map((s) => s.playerId) } },
      select: { id: true, name: true, surname: true },
    })
  }

  const scorerMap = new Map(scorers.map((s) => [s.id, s]))

  // 4. Fetch cards for this team grouped by player
  const cardsByPlayer = await db.card.groupBy({
    by: ["playerId"],
    where: { teamId: id, match: { status: "FINISHED" } },
    _count: { id: true },
    _sum: { minute: true },
  })
  const yellowCounts = await db.card.groupBy({
    by: ["playerId"],
    where: { teamId: id, match: { status: "FINISHED" }, type: "YELLOW" },
    _count: { id: true },
  })
  const redCounts = await db.card.groupBy({
    by: ["playerId"],
    where: { teamId: id, match: { status: "FINISHED" }, type: "RED" },
    _count: { id: true },
  })

  const cardPlayerIds = [...new Set(cardsByPlayer.map((c) => c.playerId))]
  let cardPlayers: { id: string; name: string; surname: string }[] = []
  if (cardPlayerIds.length > 0) {
    cardPlayers = await db.player.findMany({
      where: { id: { in: cardPlayerIds } },
      select: { id: true, name: true, surname: true },
    })
  }

  const cardPlayerMap = new Map(cardPlayers.map((p) => [p.id, p]))
  const yellowMap = new Map(yellowCounts.map((c) => [c.playerId, c._count.id]))
  const redMap = new Map(redCounts.map((c) => [c.playerId, c._count.id]))

  // Compute standing with zeroes fallback
  const s = team.standing
  const stats = {
    pts: s?.pts ?? 0,
    pj: s?.pj ?? 0,
    pg: s?.pg ?? 0,
    pe: s?.pe ?? 0,
    pp: s?.pp ?? 0,
    gf: s?.gf ?? 0,
    gc: s?.gc ?? 0,
    dg: s?.dg ?? 0,
    ta: s?.ta ?? 0,
    tr: s?.tr ?? 0,
  }

  const statItems = [
    { label: "Pts", value: stats.pts, highlight: true },
    { label: "PJ", value: stats.pj },
    { label: "PG", value: stats.pg, positive: true },
    { label: "PE", value: stats.pe },
    { label: "PP", value: stats.pp, negative: true },
    { label: "GF", value: stats.gf },
    { label: "GC", value: stats.gc },
    { label: "DG", value: stats.dg, sign: true },
    { label: "TA", value: stats.ta },
    { label: "TR", value: stats.tr },
  ]

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href="/standings"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a posiciones
      </Link>

      {/* Team header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <TeamLogo logoUrl={team.logoUrl} color={team.color} name={team.name} size="lg" />
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
              {team.name}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {team.category.name} &mdash; {team.category.league.name}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          {team.shortName}
        </Badge>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-5 gap-3 sm:grid-cols-10">
        {statItems.map((item) => (
          <Card key={item.label} size="sm" className="text-center">
            <CardContent className="px-2 py-3">
              <div className="text-xs font-medium text-muted-foreground">{item.label}</div>
              <div
                className={cn(
                  "mt-1 text-lg font-bold tabular-nums",
                  item.highlight && "text-primary",
                  item.positive && "text-green-600 dark:text-green-400",
                  item.negative && "text-red-500 dark:text-red-400",
                )}
              >
                {item.sign
                  ? item.value > 0
                    ? `+${item.value}`
                    : item.value
                  : item.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Roster */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-xl font-semibold tracking-tight">Plantel</h2>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
            {team.players.length}
          </span>
        </div>

        {team.players.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Sin jugadores activos"
            description="Este equipo no tiene jugadores activos en este momento."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-16 text-center">
                    <Hash className="mx-auto h-4 w-4" />
                  </TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden sm:table-cell">Apellido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.players.map((player) => (
                  <TableRow key={player.id} className="transition-colors hover:bg-muted/40">
                    <TableCell className="text-center font-mono text-sm font-bold text-muted-foreground">
                      {player.jerseyNumber ?? "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/players/${player.id}`}
                        className="hover:underline transition-colors"
                      >
                        {player.name}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      <Link
                        href={`/players/${player.id}`}
                        className="hover:underline transition-colors"
                      >
                        {player.surname}
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* Match results */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Swords className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-xl font-semibold tracking-tight">Partidos</h2>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
            {matches.length}
          </span>
        </div>

        {matches.length === 0 ? (
          <EmptyState
            icon={Swords}
            title="Sin partidos jugados"
            description="Este equipo aún no ha disputado partidos finalizados."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-20 text-center">Resultado</TableHead>
                  <TableHead>Rival</TableHead>
                  <TableHead className="w-24 text-center">Marcador</TableHead>
                  <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                  <TableHead className="hidden md:table-cell w-16 text-center">Jorn.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((match) => {
                  const isLocal = match.localTeamId === id
                  const teamScore = isLocal ? match.localScore : match.visitorScore
                  const opponentScore = isLocal ? match.visitorScore : match.localScore
                  const opponent = isLocal ? match.visitorTeam : match.localTeam
                  const result =
                    teamScore != null && opponentScore != null
                      ? teamScore > opponentScore
                        ? "W"
                        : teamScore < opponentScore
                          ? "L"
                          : "D"
                      : "D"

                  return (
                    <TableRow key={match.id} className="transition-colors hover:bg-muted/40">
                      <TableCell className="text-center">
                        <span
                          className={cn(
                            "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                            resultBadge(result),
                          )}
                        >
                          {resultLabel[result]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TeamLogo logoUrl={opponent.logoUrl} color={opponent.color} name={opponent.name} size="md" />
                          <span className="font-medium">{opponent.shortName}</span>
                          <span className="hidden text-xs text-muted-foreground sm:inline">
                            {opponent.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold tabular-nums">
                        {teamScore != null && opponentScore != null
                          ? `${teamScore} – ${opponentScore}`
                          : "—"}
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                        {match.date.toLocaleDateString("es-AR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
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

      {/* Top scorers */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Goal className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-xl font-semibold tracking-tight">Goleadores</h2>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
            {topScorersRaw.length}
          </span>
        </div>

        {topScorersRaw.length === 0 ? (
          <EmptyState
            icon={Goal}
            title="Sin goles registrados"
            description="Este equipo aún no ha marcado goles en partidos finalizados."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Jugador</TableHead>
                  <TableHead className="w-24 text-center">Goles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topScorersRaw.map((entry, idx) => {
                  const player = scorerMap.get(entry.playerId)
                  return (
                    <TableRow
                      key={entry.playerId}
                      className="transition-colors hover:bg-muted/40"
                    >
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link
                          href={`/players/${entry.playerId}`}
                          className="transition-colors hover:text-primary hover:underline"
                        >
                          {player?.name ?? "Desconocido"} {player?.surname ?? ""}
                        </Link>
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

      {/* Cards */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-xl font-semibold tracking-tight">Tarjetas</h2>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
            {cardsByPlayer.length}
          </span>
        </div>

        {cardsByPlayer.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="Sin tarjetas"
            description="Este equipo no ha recibido tarjetas en partidos finalizados."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Jugador</TableHead>
                  <TableHead className="w-24 text-center">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="inline-block h-3 w-2 rounded-sm bg-yellow-400" />
                      Amarillas
                    </span>
                  </TableHead>
                  <TableHead className="w-24 text-center">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="inline-block h-3 w-2 rounded-sm bg-red-500" />
                      Rojas
                    </span>
                  </TableHead>
                  <TableHead className="w-24 text-center">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cardsByPlayer
                  .sort((a, b) => (b._count.id ?? 0) - (a._count.id ?? 0))
                  .map((entry, idx) => {
                    const player = cardPlayerMap.get(entry.playerId)
                    const yellows = yellowMap.get(entry.playerId) ?? 0
                    const reds = redMap.get(entry.playerId) ?? 0
                    return (
                      <TableRow
                        key={entry.playerId}
                        className="transition-colors hover:bg-muted/40"
                      >
                        <TableCell className="text-center text-sm text-muted-foreground">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          <Link
                            href={`/players/${entry.playerId}`}
                            className="transition-colors hover:text-primary hover:underline"
                          >
                            {player?.name ?? "Desconocido"} {player?.surname ?? ""}
                          </Link>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm font-bold text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                            <span className="inline-block h-2 w-1.5 rounded-sm bg-yellow-400" />
                            {yellows}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            <span className="inline-block h-2 w-1.5 rounded-sm bg-red-500" />
                            {reds}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-semibold tabular-nums">
                          {yellows + reds}
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
