export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import db from "@/lib/db"
import { getLeagueBySlug } from "@/lib/get-league"
import { Shield, Trophy } from "lucide-react"
import { CategorySelector } from "@/components/public/category-selector"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { TeamLogo } from "@/components/ui/team-logo"
import { getLeastConceded } from "@/lib/analytics"

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ categoryId?: string }>
}

async function VallasContent({ slug, categoryId }: { slug: string; categoryId?: string }) {
  const league = await getLeagueBySlug(slug)
  if (!league) notFound()

  const categories = await db.category.findMany({
    where: { leagueId: league.id, isActive: true },
    include: { league: { select: { name: true } } },
    orderBy: { name: "asc" },
  })

  let selectedCategory: (typeof categories)[0] | undefined
  if (categoryId) {
    selectedCategory = categories.find((c) => c.id === categoryId)
  } else if (categories.length > 0) {
    selectedCategory = categories[0]
  }

  const concededTeams = selectedCategory ? await getLeastConceded(undefined, selectedCategory.id) : []

  return (
    <div className="relative space-y-6">
      {/* Background image */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <img
          src="/goleador.jpeg"
          alt=""
          className="h-full w-full object-cover object-center opacity-15"
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
            {league.name} — Valla menos vencida
          </h1>
          <p className="mt-1 text-muted-foreground">
            Temporada {league.season} &middot; Equipos con menos goles recibidos
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <CategorySelector categories={categories} basePath={`/liga/${slug}/vallas`} />
        </div>
      </div>

      {!selectedCategory ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Shield className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">No hay categorías disponibles</p>
          <p className="mt-1 text-sm text-muted-foreground/60">Las categorías se muestran aquí una vez que el administrador las cree.</p>
        </div>
      ) : concededTeams.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Shield className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">Sin partidos finalizados</p>
          <p className="mt-1 text-sm text-muted-foreground/60">
            Aún no hay goles recibidos cargados en <span className="font-medium">{selectedCategory.name}</span>.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b px-6 py-4">
            <Trophy className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-xl font-semibold tracking-tight">
              {selectedCategory.name} — {selectedCategory.league.name}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Equipo</TableHead>
                  <TableHead className="w-32 text-center">Goles recibidos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {concededTeams.map((team, idx) => (
                  <TableRow key={team.teamShortName} className={cn("transition-colors hover:bg-muted/40", idx % 2 === 1 && "bg-muted/15", idx < 3 && "bg-gradient-to-r from-emerald-500/5 to-transparent dark:from-emerald-500/10", idx === 0 && "font-medium")}>
                    <TableCell className="text-center">
                      <span className={cn(
                        "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ring-1",
                        idx === 0 ? "bg-emerald-500/15 text-emerald-700 ring-emerald-500/40 dark:text-emerald-400" :
                        idx === 1 ? "bg-slate-300/30 text-slate-600 ring-slate-400/30 dark:text-slate-300" :
                        idx === 2 ? "bg-amber-500/20 text-amber-700 ring-amber-500/30 dark:text-amber-400" :
                        "bg-muted/50 text-muted-foreground ring-border/50",
                      )}>
                        {idx + 1}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TeamLogo logoUrl={team.teamLogoUrl} color={team.teamColor} name={team.teamShortName} size="md" />
                        <span className="text-sm text-muted-foreground">{team.teamShortName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-bold text-emerald-700 dark:text-emerald-400">{team.goals}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <p className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500/30" />
          Solo se contabilizan partidos finalizados, sumando los goles del rival.
        </p>
      </div>
    </div>
  )
}

export default async function LeagueVallasPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { categoryId } = await searchParams

  return <VallasContent slug={slug} categoryId={categoryId} />
}