import { Suspense } from "react"
import db from "@/lib/db"
import { Calendar } from "lucide-react"
import { LeagueSelector } from "@/components/ui/league-selector"
import { MatchScheduleFilter } from "@/components/public/match-schedule-filter"
import { MatchCalendarGrid, buildCalendarWeeks } from "@/components/public/match-calendar-grid"

export const metadata = {
  title: "Calendario — Partidos — Liga",
  description: "Vista calendario de los partidos de la liga",
}

async function CalendarContent({
  categoryId,
  leagueId,
}: {
  categoryId?: string
  leagueId?: string
}) {
  const leagues = await db.league.findMany({
    orderBy: { name: "asc" },
  })

  const categories = await db.category.findMany({
    where: leagueId ? { leagueId } : undefined,
    include: { league: { select: { name: true } } },
    orderBy: { name: "asc" },
  })

  // Determine the visible range: current month
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999)

  const where: Record<string, unknown> = {}
  if (categoryId) {
    where.categoryId = categoryId
  }
  if (leagueId && !categoryId) {
    const leagueCategoryIds = categories.map((c) => c.id)
    if (leagueCategoryIds.length > 0) {
      where.categoryId = { in: leagueCategoryIds }
    }
  }
  where.date = { gte: monthStart, lte: monthEnd }

  const matches = await db.match.findMany({
    where,
    include: {
      category: { select: { name: true } },
      localTeam: {
        select: { id: true, name: true, shortName: true, color: true },
      },
      visitorTeam: {
        select: { id: true, name: true, shortName: true, color: true },
      },
    },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  })

  const weeks = buildCalendarWeeks(year, month, matches)

  const selectedCategory = categoryId
    ? categories.find((c) => c.id === categoryId)
    : undefined

  const monthName = now.toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Calendario de Partidos
          </h1>
          <p className="mt-1 text-muted-foreground">
            Vista calendario — {monthName}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <LeagueSelector leagues={leagues} />
          <MatchScheduleFilter categories={categories} currentCategoryId={categoryId} />
        </div>
      </div>

      {/* Calendar */}
      {matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Calendar className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">
            No hay partidos en este período
          </p>
          <p className="mt-1 text-sm text-muted-foreground/60">
            {selectedCategory
              ? `No hay partidos en ${selectedCategory.name} para ${monthName}.`
              : categories.length > 0
                ? "Seleccioná una categoría para ver sus partidos."
                : "Los partidos aparecerán aquí cuando el administrador los cree."}
          </p>
        </div>
      ) : (
        <MatchCalendarGrid weeks={weeks} currentMonth={monthName} />
      )}
    </div>
  )
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string; leagueId?: string }>
}) {
  const { categoryId, leagueId } = await searchParams

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <CalendarContent categoryId={categoryId} leagueId={leagueId} />
    </Suspense>
  )
}
