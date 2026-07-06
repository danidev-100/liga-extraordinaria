import Link from "next/link"
import { auth } from "@/lib/auth"
import db from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Clock, Play, CheckCircle2, Calendar } from "lucide-react"
import { DeleteButton } from "@/components/forms/delete-button"
import { ClearFinishedButton } from "@/components/forms/clear-finished-button"
import { deleteMatch } from "@/actions/matches"
import { Badge } from "@/components/ui/badge"
import { LeagueSelector } from "@/components/ui/league-selector"
import { TeamLogo } from "@/components/ui/team-logo"

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
}

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string; leagueId?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) return null

  const { categoryId, leagueId } = await searchParams

  const leagues = await db.league.findMany({
    orderBy: { name: "asc" },
  })

  const categories = await db.category.findMany({
    where: leagueId ? { leagueId } : undefined,
    include: { league: { select: { name: true } } },
    orderBy: { name: "asc" },
  })

  const matchWhere: Record<string, unknown> = {}
  if (categoryId) {
    matchWhere.categoryId = categoryId
  } else if (leagueId) {
    const leagueCategoryIds = categories.map((c) => c.id)
    if (leagueCategoryIds.length > 0) {
      matchWhere.categoryId = { in: leagueCategoryIds }
    }
  }

  const matches = await db.match.findMany({
    where: Object.keys(matchWhere).length > 0 ? matchWhere : undefined,
    include: {
      category: { select: { name: true } },
      court: { select: { name: true } },
      localTeam: { select: { id: true, name: true, shortName: true, logoUrl: true, color: true } },
      visitorTeam: { select: { id: true, name: true, shortName: true, logoUrl: true, color: true } },
    },
    orderBy: [{ date: "desc" }, { time: "desc" }],
  })

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
          <ClearFinishedButton />
          <Link href="/admin/matches/fixture/new">
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Generar<span className="hidden sm:inline"> Temporada</span>
            </Button>
          </Link>
          <Link href="/admin/matches/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo<span className="hidden sm:inline"> Partido</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* League selector */}
      <LeagueSelector leagues={leagues} />

      {/* Category filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        <Link href={leagueId ? `/admin/matches?leagueId=${leagueId}` : "/admin/matches"}>
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
            href={`/admin/matches?categoryId=${cat.id}${leagueId ? `&leagueId=${leagueId}` : ""}`}
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
        <div className="space-y-3">
          {matches.map((match) => {
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
                        className="gap-1.5 px-2.5 py-0.5 text-xs font-semibold"
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        {status.label}
                      </Badge>
                      <span className="text-xs font-medium text-muted-foreground">
                        R{match.round}
                      </span>
                    </div>

                    {/* Teams */}
                    <p className="font-heading text-lg font-bold leading-tight flex items-center gap-2">
                      <TeamLogo logoUrl={match.localTeam.logoUrl} color={match.localTeam.color} name={match.localTeam.name} size="md" />
                      <span>{match.localTeam.shortName}</span>
                      <span className="text-muted-foreground">vs</span>
                      <TeamLogo logoUrl={match.visitorTeam.logoUrl} color={match.visitorTeam.color} name={match.visitorTeam.name} size="md" />
                      <span>{match.visitorTeam.shortName}</span>
                    </p>

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
                      {match.court.name}
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
                        {match.status === "SCHEDULED" ? "Cargar" : "Ver"}
                      </Button>
                    </Link>
                    {match.status === "SCHEDULED" && (
                      <DeleteButton
                        action={deleteMatch.bind(null, match.id)}
                        confirmMessage="¿Eliminar este partido?"
                      />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
