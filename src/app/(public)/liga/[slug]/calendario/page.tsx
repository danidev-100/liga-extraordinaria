
import { notFound } from "next/navigation"
import db from "@/lib/db"
import { getLeagueBySlug } from "@/lib/get-league"
import { Calendar } from "lucide-react"
import { MatchScheduleFilter } from "@/components/public/match-schedule-filter"
import { MatchCalendarGrid, buildCalendarWeeks } from "@/components/public/match-calendar-grid"

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ categoryId?: string }>
}

async function CalendarContent({
  slug,
  categoryId,
}: {
  slug: string
  categoryId?: string
}) {
  const league = await getLeagueBySlug(slug)
  if (!league) notFound()

  const categories = await db.category.findMany({
    where: { leagueId: league.id, isActive: true },
    include: { league: { select: { name: true } } },
    orderBy: { name: "asc" },
  })

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999)

  const where: Record<string, unknown> = {}
  if (categoryId) {
    where.categoryId = categoryId
  } else {
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
      localTeam: { select: { id: true, name: true, shortName: true, color: true } },
      visitorTeam: { select: { id: true, name: true, shortName: true, color: true } },
    },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  })

  const weeks = buildCalendarWeeks(year, month, matches)
  const monthName = now.toLocaleDateString("es-AR", { month: "long", year: "numeric" })

  return (
    <div className="relative space-y-6">
      {/* Background image */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <img
          src="/noche.png"
          alt=""
          className="h-full w-full object-cover object-center opacity-15"
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            {league.name} — Calendario
          </h1>
          <p className="mt-1 text-muted-foreground">
            Vista calendario — {monthName}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <MatchScheduleFilter categories={categories} currentCategoryId={categoryId} />
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Calendar className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">No hay partidos en este período</p>
          <p className="mt-1 text-sm text-muted-foreground/60">
            {categoryId
              ? "No hay partidos en esta categoría para este mes."
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

export default async function LeagueCalendarPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { categoryId } = await searchParams

  return <CalendarContent slug={slug} categoryId={categoryId} />
}
