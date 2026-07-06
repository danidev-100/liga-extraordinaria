interface StatsTeam {
  id: string
  name: string
  shortName: string
}

interface MatchStatsProps {
  localTeam: StatsTeam
  visitorTeam: StatsTeam
  localScore: number | null
  visitorScore: number | null
  goals: Array<{ teamId: string; isOwnGoal: boolean }>
  cards: Array<{ teamId: string; type: string }>
}

export function MatchStats({
  localTeam,
  visitorTeam,
  localScore,
  visitorScore,
  goals,
  cards,
}: MatchStatsProps) {
  const localGoals = goals.filter(
    (g) => g.teamId === localTeam.id && !g.isOwnGoal,
  ).length
  const visitorGoals = goals.filter(
    (g) => g.teamId === visitorTeam.id && !g.isOwnGoal,
  ).length
  const localOwnGoals = goals.filter(
    (g) => g.teamId === localTeam.id && g.isOwnGoal,
  ).length
  const visitorOwnGoals = goals.filter(
    (g) => g.teamId === visitorTeam.id && g.isOwnGoal,
  ).length
  const localYellow = cards.filter(
    (c) => c.teamId === localTeam.id && c.type === "YELLOW",
  ).length
  const visitorYellow = cards.filter(
    (c) => c.teamId === visitorTeam.id && c.type === "YELLOW",
  ).length
  const localRed = cards.filter(
    (c) => c.teamId === localTeam.id && c.type === "RED",
  ).length
  const visitorRed = cards.filter(
    (c) => c.teamId === visitorTeam.id && c.type === "RED",
  ).length

  const hasAnyStat =
    localGoals > 0 ||
    visitorGoals > 0 ||
    localOwnGoals > 0 ||
    visitorOwnGoals > 0 ||
    localYellow > 0 ||
    visitorYellow > 0 ||
    localRed > 0 ||
    visitorRed > 0

  if (!hasAnyStat) return null

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="border-b px-5 py-3">
        <h3 className="font-heading text-base font-semibold">
          Estadísticas del Partido
        </h3>
      </div>
      <div className="divide-y">
        {/* Goals row */}
        <div className="grid grid-cols-3 items-center gap-4 px-5 py-3 text-sm">
          <span className="text-right font-medium">{localGoals + localOwnGoals}</span>
          <span className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            Goles
          </span>
          <span className="font-medium">{visitorGoals + visitorOwnGoals}</span>
        </div>

        {/* Own goals row */}
        {(localOwnGoals > 0 || visitorOwnGoals > 0) && (
          <div className="grid grid-cols-3 items-center gap-4 px-5 py-3 text-sm">
            <span className="text-right text-muted-foreground">
              {localOwnGoals > 0 && (
                <span className="text-destructive">{localOwnGoals} e/c</span>
              )}
            </span>
            <span className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              En contra
            </span>
            <span className="text-muted-foreground">
              {visitorOwnGoals > 0 && (
                <span className="text-destructive">{visitorOwnGoals} e/c</span>
              )}
            </span>
          </div>
        )}

        {/* Yellow cards row */}
        <div className="grid grid-cols-3 items-center gap-4 px-5 py-3 text-sm">
          <span className="text-right font-medium">{localYellow}</span>
          <span className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            <span className="inline-block h-2 w-1.5 rounded-sm bg-yellow-400 align-middle" />{" "}
            Amarillas
          </span>
          <span className="font-medium">{visitorYellow}</span>
        </div>

        {/* Red cards row */}
        <div className="grid grid-cols-3 items-center gap-4 px-5 py-3 text-sm">
          <span className="text-right font-medium">{localRed}</span>
          <span className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            <span className="inline-block h-2 w-1.5 rounded-sm bg-red-500 align-middle" />{" "}
            Rojas
          </span>
          <span className="font-medium">{visitorRed}</span>
        </div>
      </div>
    </div>
  )
}
