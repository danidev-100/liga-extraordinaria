import { TeamLogo } from "@/components/ui/team-logo"
import { GoalBall, CardIcon } from "@/components/ui/card-icons"

interface TimelineGoal {
  id: string
  minute: number
  isOwnGoal: boolean
  player: { name: string; surname: string }
  team: { id: string; name: string; shortName: string; color: string | null; logoUrl: string | null }
}

interface TimelineCard {
  id: string
  minute: number
  type: "YELLOW" | "RED"
  isSecondYellow: boolean
  player: { name: string; surname: string }
  team: { id: string; name: string; shortName: string; color: string | null; logoUrl: string | null }
}

interface MatchTimelineProps {
  localTeamId: string
  visitorTeamId: string
  goals: TimelineGoal[]
  cards: TimelineCard[]
}

type TimelineEvent =
  | { kind: "goal"; data: TimelineGoal }
  | { kind: "card"; data: TimelineCard }

export function MatchTimeline({
  localTeamId,
  visitorTeamId,
  goals,
  cards,
}: MatchTimelineProps) {
  // Merge and sort by minute
  const events: TimelineEvent[] = [
    ...goals.map((g) => ({ kind: "goal" as const, data: g })),
    ...cards.map((c) => ({ kind: "card" as const, data: c })),
  ].sort((a, b) => {
    const diff = a.data.minute - b.data.minute
    if (diff !== 0) return diff
    // Goals before cards at same minute
    if (a.kind !== b.kind) return a.kind === "goal" ? -1 : 1
    return 0
  })

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">Sin eventos registrados</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="border-b px-5 py-3">
        <h3 className="font-heading text-base font-semibold">Línea de Tiempo</h3>
      </div>
      <div className="px-5 py-4">
        <ul className="relative space-y-0">
          {/* Vertical line */}
          <span className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border/60" aria-hidden="true" />

          {events.map((event) => {
            if (event.kind === "goal") {
              return <GoalItem key={event.data.id} goal={event.data} localTeamId={localTeamId} />
            }
            return <CardItem key={event.data.id} card={event.data} localTeamId={localTeamId} />
          })}
        </ul>
      </div>
    </div>
  )
}

function GoalItem({
  goal,
  localTeamId,
}: {
  goal: TimelineGoal
  localTeamId: string
}) {
  const isLocal = goal.team.id === localTeamId
  const teamColor = isLocal ? "var(--primary)" : "#64748b"

  return (
    <li className="relative flex items-start gap-3 pb-4 last:pb-0">
      {/* Goal dot */}
      <span className="relative z-10 mt-1 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full ring-2 ring-background">
        <GoalBall />
      </span>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col justify-center pt-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {goal.player.name} {goal.player.surname}
          </span>
          {goal.isOwnGoal && (
            <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
              en contra
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <TeamLogo logoUrl={goal.team.logoUrl} color={goal.team.color} name={goal.team.name} size="md" />
          <span className="font-medium" style={{ color: teamColor }}>
            {goal.team.shortName}
          </span>
          <span className="font-mono">{goal.minute}&apos;</span>
        </div>
      </div>
    </li>
  )
}

function CardItem({
  card,
  localTeamId,
}: {
  card: TimelineCard
  localTeamId: string
}) {
  const isLocal = card.team.id === localTeamId
  const teamColor = isLocal ? "var(--primary)" : "#64748b"
  const isDoubleYellowRed = card.isSecondYellow && card.type === "RED"

  return (
    <li className="relative flex items-start gap-3 pb-4 last:pb-0">
      {/* Card icon */}
      <span className="relative z-10 mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full ring-2 ring-background">
        <CardIcon type={card.type} isSecondYellow={isDoubleYellowRed} />
      </span>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col justify-center pt-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {card.player.name} {card.player.surname}
          </span>
          {isDoubleYellowRed && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              2da amarilla
            </span>
          )}
          {card.type === "YELLOW" && (
            <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
              Amarilla
            </span>
          )}
          {card.type === "RED" && !isDoubleYellowRed && (
            <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
              Roja
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <TeamLogo logoUrl={card.team.logoUrl} color={card.team.color} name={card.team.name} size="md" />
          <span className="font-medium" style={{ color: teamColor }}>
            {card.team.shortName}
          </span>
          <span className="font-mono">{card.minute}&apos;</span>
        </div>
      </div>
    </li>
  )
}
