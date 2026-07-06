import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import db from "@/lib/db"
import { MatchForm } from "@/components/forms/match-form"
import { MatchResultForm } from "@/components/forms/match-result-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, Play } from "lucide-react"
import { TeamLogo } from "@/components/ui/team-logo"

const statusConfig = {
  SCHEDULED: { label: "Programado", variant: "secondary" as const, icon: Clock },
  PLAYING: { label: "Jugando", variant: "default" as const, icon: Play },
  FINISHED: { label: "Finalizado", variant: "outline" as const, icon: CheckCircle2 },
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) return null

  const { id } = await params

  const match = await db.match.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true } },
      court: { select: { id: true, name: true } },
      localTeam: {
        select: {
          id: true,
          name: true,
          shortName: true,
          color: true,
          logoUrl: true,
          players: {
            select: { id: true, name: true, surname: true },
            orderBy: { name: "asc" },
          },
        },
      },
      visitorTeam: {
        select: {
          id: true,
          name: true,
          shortName: true,
          color: true,
          logoUrl: true,
          players: {
            select: { id: true, name: true, surname: true },
            orderBy: { name: "asc" },
          },
        },
      },
      goals: {
        include: {
          player: { select: { id: true, name: true, surname: true } },
          team: { select: { id: true, name: true, shortName: true, color: true, logoUrl: true } },
        },
        orderBy: { minute: "asc" },
      },
      cards: {
        include: {
          player: { select: { id: true, name: true, surname: true } },
          team: { select: { id: true, name: true, shortName: true, color: true, logoUrl: true } },
        },
        orderBy: { minute: "asc" },
      },
    },
  })

  if (!match) {
    notFound()
  }

  const status = statusConfig[match.status]
  const StatusIcon = status.icon
  const isFinished = match.status === "FINISHED"
  const isScheduled = match.status === "SCHEDULED"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <TeamLogo logoUrl={match.localTeam.logoUrl} color={match.localTeam.color} name={match.localTeam.name} size="md" />
          <span>{match.localTeam.shortName}</span>
          <span className="text-muted-foreground/50">vs</span>
          <TeamLogo logoUrl={match.visitorTeam.logoUrl} color={match.visitorTeam.color} name={match.visitorTeam.name} size="md" />
          <span>{match.visitorTeam.shortName}</span>
        </h1>
        <p className="text-muted-foreground">
          {match.category.name} · Ronda {match.round}
        </p>
      </div>

      {/* Match info card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StatusIcon className="h-5 w-5" />
            {status.label}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <span className="text-sm text-muted-foreground">Fecha:</span>{" "}
              <span>{new Date(match.date).toLocaleDateString("es-AR")}</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Hora:</span>{" "}
              <span>{match.time}</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Cancha:</span>{" "}
              <span>{match.court.name}</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Categoría:</span>{" "}
              <span>{match.category.name}</span>
            </div>
          </div>

          {isFinished && match.localScore !== null && match.visitorScore !== null && (
            <div className="mt-4 rounded-lg bg-muted p-4 text-center">
              <span className="text-3xl font-bold">
                {match.localScore} — {match.visitorScore}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Goals list */}
      {isFinished && match.goals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Goles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {match.goals.map((goal) => (
                <div key={goal.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <TeamLogo logoUrl={goal.team.logoUrl} color={goal.team.color} name={goal.team.name} size="sm" />
                    <span className="text-xs font-semibold text-muted-foreground">
                      {goal.team.shortName}
                    </span>
                    <span className="font-medium">
                      {goal.player.name} {goal.player.surname}
                    </span>
                    {goal.isOwnGoal && (
                      <Badge variant="secondary" className="text-xs">En contra</Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {goal.minute}&apos;
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards list */}
      {isFinished && match.cards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tarjetas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {match.cards.map((card) => {
                const isDoubleYellowRed = card.type === "RED" && card.isSecondYellow
                return (
                <div key={card.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    {isDoubleYellowRed ? (
                      <div className="flex items-center gap-0.5">
                        <div className="h-3 w-2 rounded-sm bg-yellow-400" />
                        <div className="h-3 w-2 rounded-sm bg-red-500 -ml-0.5" />
                      </div>
                    ) : (
                      <div
                        className={`h-3 w-2 rounded-sm ${
                          card.type === "YELLOW" ? "bg-yellow-400" : "bg-red-500"
                        }`}
                      />
                    )}
                    <TeamLogo logoUrl={card.team.logoUrl} color={card.team.color} name={card.team.name} size="sm" />
                    <span className="text-xs font-semibold text-muted-foreground">
                      {card.team.shortName}
                    </span>
                    <span className="font-medium">
                      {card.player.name} {card.player.surname}
                    </span>
                    {isDoubleYellowRed && (
                      <span className="rounded bg-amber-100 px-1 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        2A
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {card.minute}&apos;
                  </span>
                </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit / Result form */}
      {isScheduled && (
        <Card>
          <CardHeader>
            <CardTitle>Editar Partido</CardTitle>
          </CardHeader>
          <CardContent>
            <MatchForm
              initialData={{
                id: match.id,
                categoryId: match.categoryId,
                courtId: match.courtId,
                date: match.date,
                time: match.time,
                localTeamId: match.localTeamId,
                visitorTeamId: match.visitorTeamId,
                round: match.round,
              }}
            />
          </CardContent>
        </Card>
      )}

      {isScheduled && (
        <Card>
          <CardHeader>
            <CardTitle>Cargar Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            <MatchResultForm match={match} />
          </CardContent>
        </Card>
      )}

      {isFinished && (
        <Card>
          <CardHeader>
            <CardTitle>Editar Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            <MatchResultForm match={match} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
