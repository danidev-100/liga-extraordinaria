import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Sparkles } from "lucide-react"
import { TeamLogo } from "@/components/ui/team-logo"

interface TeamBrief {
  id: string
  name: string
  shortName: string
  color: string | null
  logoUrl: string | null
}

interface MatchHeaderProps {
  localTeam: TeamBrief
  visitorTeam: TeamBrief
  localScore: number | null
  visitorScore: number | null
  status: "SCHEDULED" | "PLAYING" | "FINISHED"
  category: { name: string }
  court: { name: string }
  date: Date
  time: string
  leagueSlug: string
}

const statusConfig = {
  SCHEDULED: { label: "Programado", variant: "secondary" as const },
  PLAYING: { label: "Jugando", variant: "default" as const },
  FINISHED: { label: "Finalizado", variant: "outline" as const },
}

export function MatchHeader({
  localTeam,
  visitorTeam,
  localScore,
  visitorScore,
  status,
  category,
  court,
  date,
  time,
  leagueSlug,
}: MatchHeaderProps) {
  const statusInfo = statusConfig[status]
  const matchDate = new Date(date)
  const isPlaying = status === "PLAYING"
  const isFinished = status === "FINISHED"
  const hasScore = isFinished && localScore != null && visitorScore != null

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* Status bar */}
      <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Badge variant={statusInfo.variant} className="gap-1">
            {isPlaying && <Sparkles className="h-3 w-3 animate-pulse" />}
            {statusInfo.label}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {category.name}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {isPlaying && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              EN VIVO
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {matchDate.toLocaleDateString("es-AR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {time}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {court.name}
          </span>
        </div>
      </div>

      {/* Scoreboard */}
      <div className="flex items-center justify-between gap-4 px-6 py-8 sm:px-10">
        {/* Local team */}
        <div className="flex flex-1 flex-col items-center gap-3 text-center">
          <TeamLogo logoUrl={localTeam.logoUrl} color={localTeam.color} name={localTeam.name} size="xl" />
          <Link
            href={`/liga/${leagueSlug}/equipos/${localTeam.id}`}
            className="font-heading text-lg font-semibold leading-tight transition-colors hover:text-primary sm:text-xl"
          >
            {localTeam.name}
          </Link>
          <TeamLogo logoUrl={localTeam.logoUrl} color={localTeam.color} name={localTeam.name} size="md" />
        </div>

        {/* Score / VS */}
        <div className="flex flex-col items-center gap-1">
          {hasScore ? (
            <div className="flex items-center gap-3 sm:gap-5">
              <span className="text-5xl font-bold tabular-nums tracking-tight sm:text-6xl">
                {localScore}
              </span>
              <span className="text-3xl font-light text-muted-foreground/30 sm:text-4xl">
                —
              </span>
              <span className="text-5xl font-bold tabular-nums tracking-tight sm:text-6xl">
                {visitorScore}
              </span>
            </div>
          ) : (
            <span className="text-3xl font-light text-muted-foreground/40 sm:text-4xl">VS</span>
          )}
          {isPlaying && (
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-0.5 text-xs font-semibold text-accent">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              EN VIVO
            </span>
          )}
        </div>

        {/* Visitor team */}
        <div className="flex flex-1 flex-col items-center gap-3 text-center">
          <TeamLogo logoUrl={visitorTeam.logoUrl} color={visitorTeam.color} name={visitorTeam.name} size="xl" />
          <Link
            href={`/liga/${leagueSlug}/equipos/${visitorTeam.id}`}
            className="font-heading text-lg font-semibold leading-tight transition-colors hover:text-primary sm:text-xl"
          >
            {visitorTeam.name}
          </Link>
          <TeamLogo logoUrl={visitorTeam.logoUrl} color={visitorTeam.color} name={visitorTeam.name} size="md" />
        </div>
      </div>
    </div>
  )
}
