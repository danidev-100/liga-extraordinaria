import { Suspense } from "react"
import db from "@/lib/db"
import { CategorySelector } from "@/components/public/category-selector"
import { StandingsTable } from "@/components/public/standings-table"
import { LeagueSelector } from "@/components/ui/league-selector"
import { Trophy } from "lucide-react"

export const metadata = {
  title: "Posiciones — Liga",
  description: "Tabla de posiciones de la liga",
}

async function StandingsContent({ categoryId, leagueId }: { categoryId?: string; leagueId?: string }) {
  const leagues = await db.league.findMany({
    orderBy: { name: "asc" },
  })

  const categories = await db.category.findMany({
    where: leagueId ? { leagueId } : undefined,
    include: { league: { select: { name: true } } },
    orderBy: { name: "asc" },
  })

  let standings: Array<{
    id: string
    position: number
    pts: number
    pj: number
    pg: number
    pe: number
    pp: number
    gf: number
    gc: number
    dg: number
    ta: number
    tr: number
    team: { id: string; name: string; shortName: string; color: string | null }
  }> = []

  let selectedCategory: (typeof categories)[0] | undefined

  if (categoryId) {
    selectedCategory = categories.find((c) => c.id === categoryId)
  }

  if (categoryId && selectedCategory) {
    standings = await db.standing.findMany({
      where: { categoryId },
      include: {
        team: { select: { id: true, name: true, shortName: true, color: true } },
      },
      orderBy: { position: "asc" },
    })
  } else if (categories.length > 0) {
    // Auto-select first category
    selectedCategory = categories[0]
    standings = await db.standing.findMany({
      where: { categoryId: categories[0].id },
      include: {
        team: { select: { id: true, name: true, shortName: true, color: true } },
      },
      orderBy: { position: "asc" },
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
            Tabla de Posiciones
          </h1>
          <p className="mt-1 text-muted-foreground">
            Consultá las posiciones de cada categoría
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <LeagueSelector leagues={leagues} />
          <CategorySelector categories={categories} />
        </div>
      </div>

      {/* Standings */}
      {!selectedCategory ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Trophy className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">
            No hay categorías disponibles
          </p>
          <p className="mt-1 text-sm text-muted-foreground/60">
            Las categorías se muestran aquí una vez que el administrador las cree.
          </p>
        </div>
      ) : standings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Trophy className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">
            Sin posiciones aún
          </p>
          <p className="mt-1 text-sm text-muted-foreground/60">
            Las posiciones se generan automáticamente cuando hay partidos finalizados en{" "}
            <span className="font-medium">{selectedCategory.name}</span>.
          </p>
        </div>
      ) : (
        <StandingsTable
          standings={standings}
          categoryName={`${selectedCategory.name} — ${selectedCategory.league.name}`}
        />
      )}

      {/* Footer info */}
      <div className="rounded-lg border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>Pts: Puntos</span>
          <span>PJ: Partidos Jugados</span>
          <span>PG: Partidos Ganados</span>
          <span>PE: Partidos Empatados</span>
          <span>PP: Partidos Perdidos</span>
          <span>DG: Diferencia de Gol</span>
        </p>
      </div>
    </div>
  )
}

export default async function PublicStandingsPage({
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
      <StandingsContent categoryId={categoryId} leagueId={leagueId} />
    </Suspense>
  )
}
