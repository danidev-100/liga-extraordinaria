export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import db from "@/lib/db"
import { getLeagueBySlug } from "@/lib/get-league"
import { CategorySelector } from "@/components/public/category-selector"
import { StandingsTable } from "@/components/public/standings-table"
import { Trophy } from "lucide-react"
import { PrintButton } from "@/components/ui/print-button"

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ categoryId?: string }>
}

async function StandingsContent({
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
    team: { id: string; name: string; shortName: string; color: string | null; logoUrl: string | null }
  }> = []

  let selectedCategory: (typeof categories)[0] | undefined

  if (categoryId) {
    selectedCategory = categories.find((c) => c.id === categoryId)
  }

  if (categoryId && selectedCategory) {
    standings = await db.standing.findMany({
      where: { categoryId },
      include: {
        team: { select: { id: true, name: true, shortName: true, color: true, logoUrl: true } },
      },
      orderBy: { position: "asc" },
    })
  } else if (categories.length > 0) {
    selectedCategory = categories[0]
    standings = await db.standing.findMany({
      where: { categoryId: categories[0].id },
      include: {
        team: { select: { id: true, name: true, shortName: true, color: true, logoUrl: true } },
      },
      orderBy: { position: "asc" },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
            {league.name} — Posiciones
          </h1>
          <p className="mt-1 text-muted-foreground">
            Temporada {league.season} &middot; Consultá las posiciones de cada categoría
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <PrintButton />
          <CategorySelector categories={categories} basePath={`/liga/${slug}/posiciones`} />
        </div>
      </div>

      {!selectedCategory ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Trophy className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">No hay categorías disponibles</p>
          <p className="mt-1 text-sm text-muted-foreground/60">
            Las categorías se muestran aquí una vez que el administrador las cree.
          </p>
        </div>
      ) : standings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Trophy className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">Sin posiciones aún</p>
          <p className="mt-1 text-sm text-muted-foreground/60">
            Las posiciones se generan automáticamente cuando hay partidos finalizados en{" "}
            <span className="font-medium">{selectedCategory.name}</span>.
          </p>
        </div>
      ) : (
        <StandingsTable
          standings={standings}
          categoryName={`${selectedCategory.name} — ${selectedCategory.league.name}`}
          leagueSlug={slug}
        />
      )}

      <style>{`
        @media print {
          a { color: inherit !important; text-decoration: none !important; }
          .overflow-x-auto { overflow: visible !important; }
          table { width: 100% !important; }
          tr { page-break-inside: avoid; }
        }
      `}</style>

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

export default async function LeagueStandingsPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { categoryId } = await searchParams

  return <StandingsContent slug={slug} categoryId={categoryId} />
}
