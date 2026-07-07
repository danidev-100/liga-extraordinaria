import Link from "next/link"
import { Badge } from "@/components/ui/badge"

interface MatchCalendarMatch {
  id: string
  date: Date
  time: string
  status: "SCHEDULED" | "PLAYING" | "FINISHED"
  localScore: number | null
  visitorScore: number | null
  localTeam: { id: string; name: string; shortName: string; color: string | null }
  visitorTeam: { id: string; name: string; shortName: string; color: string | null }
  category: { name: string }
}

interface CalendarWeek {
  label: string
  start: Date
  end: Date
  days: CalendarDay[]
}

interface CalendarDay {
  date: Date
  dayOfMonth: number
  isCurrentMonth: boolean
  matches: MatchCalendarMatch[]
}

interface MatchCalendarGridProps {
  weeks: CalendarWeek[]
  currentMonth: string
}

const statusConfig = {
  SCHEDULED: { label: "Programado", variant: "secondary" as const },
  PLAYING: { label: "Jugando", variant: "default" as const },
  FINISHED: { label: "Finalizado", variant: "outline" as const },
}

const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

export function MatchCalendarGrid({ weeks, currentMonth }: MatchCalendarGridProps) {
  if (weeks.length === 0) return null

  return (
    <div className="space-y-4">
      {/* Month header */}
      <div className="text-center">
        <h3 className="font-heading text-lg font-semibold capitalize">{currentMonth}</h3>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {dayNames.map((name) => (
          <div
            key={name}
            className="py-1.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {name}
          </div>
        ))}

        {/* Weeks */}
        {weeks.map((week) => (
          week.days.map((day, dayIdx) => (
            <div
              key={`${week.label}-${dayIdx}`}
              className={`min-h-[120px] rounded-lg border p-2 transition-colors md:min-h-[100px] md:p-1.5 ${
                day.isCurrentMonth
                  ? "bg-card"
                  : "bg-muted/20"
              } ${
                day.matches.length > 0
                  ? "border-primary/20"
                  : "border-transparent"
              }`}
            >
              {/* Day number */}
              <div
                className={`mb-1 text-right text-xs font-medium tabular-nums ${
                  day.isCurrentMonth
                    ? "text-foreground"
                    : "text-muted-foreground/40"
                }`}
              >
                {day.dayOfMonth}
              </div>

              {/* Match cards */}
              <div className="space-y-1">
                {day.matches.map((match) => {
                  const status = statusConfig[match.status]
                  const isFinished = match.status === "FINISHED"
                  const hasScore = isFinished && match.localScore != null && match.visitorScore != null

                  return (
                    <Link
                      key={match.id}
                      href={`/matches/${match.id}`}
                      className={`group block rounded-lg border px-2 py-1.5 text-xs leading-tight transition-all hover:shadow-sm md:rounded-md md:px-1.5 md:py-1 md:text-[11px] ${
                        isFinished
                          ? "bg-muted/30 border-border/50"
                          : "border-dashed border-border/40 hover:border-primary/30"
                      }`}
                    >
                      {/* Time + status dot */}
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono font-medium text-muted-foreground">
                          {match.time}
                        </span>
                        {match.status === "PLAYING" && (
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                          </span>
                        )}
                      </div>

                      {/* Teams */}
                      <div className="mt-0.5 flex items-center gap-1 font-medium text-foreground md:mt-0.5">
                        <span className="truncate">{match.localTeam.shortName}</span>
                        {hasScore ? (
                          <span className="shrink-0 font-bold tabular-nums">
                            {match.localScore}–{match.visitorScore}
                          </span>
                        ) : (
                          <span className="shrink-0 text-muted-foreground/50">vs</span>
                        )}
                        <span className="truncate">{match.visitorTeam.shortName}</span>
                      </div>

                      {/* Category badge */}
                      <div className="mt-0.5">
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 h-auto leading-none">
                          {match.category.name}
                        </Badge>
                      </div>
                      </Link>
                  )
                })}
              </div>
            </div>
          ))
        ))}
      </div>
    </div>
  )
}

/**
 * Build weeks for the current month.
 * Each week runs Monday–Sunday.
 */
export function buildCalendarWeeks(
  year: number,
  month: number,
  matches: MatchCalendarMatch[],
): CalendarWeek[] {
  // First day of the month
  const firstDay = new Date(year, month, 1)
  // Last day of the month
  const lastDay = new Date(year, month + 1, 0)

  // Find the Monday of the week containing the first day
  const firstDayOfWeek = new Date(firstDay)
  const dow = firstDayOfWeek.getDay() // 0=Sun, 1=Mon, ...
  const mondayOffset = dow === 0 ? -6 : 1 - dow
  firstDayOfWeek.setDate(firstDayOfWeek.getDate() + mondayOffset)

  // Find the Sunday of the week containing the last day
  const lastDayOfWeek = new Date(lastDay)
  const lastDow = lastDayOfWeek.getDay()
  const sundayOffset = lastDow === 0 ? 0 : 7 - lastDow
  lastDayOfWeek.setDate(lastDayOfWeek.getDate() + sundayOffset)

  const weeks: CalendarWeek[] = []
  const current = new Date(firstDayOfWeek)

  while (current <= lastDayOfWeek) {
    const weekStart = new Date(current)
    const weekEnd = new Date(current)
    weekEnd.setDate(weekEnd.getDate() + 6)

    const days: CalendarDay[] = []

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(current)
      dayDate.setDate(dayDate.getDate() + i)

      const dayMonth = dayDate.getMonth()
      const dayOfMonth = dayDate.getDate()

      const dayMatches = matches.filter((m) => {
        const mDate = new Date(m.date)
        return (
          mDate.getFullYear() === dayDate.getFullYear() &&
          mDate.getMonth() === dayDate.getMonth() &&
          mDate.getDate() === dayDate.getDate()
        )
      })

      days.push({
        date: dayDate,
        dayOfMonth,
        isCurrentMonth: dayMonth === month,
        matches: dayMatches,
      })
    }

    weeks.push({
      label: `${weekStart.getDate()} – ${weekEnd.getDate()} ${weekEnd.toLocaleDateString("es-AR", { month: "short" })}`,
      start: weekStart,
      end: weekEnd,
      days,
    })

    // Move to next week
    current.setDate(current.getDate() + 7)
  }

  return weeks
}
