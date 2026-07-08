import Link from "next/link"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import db from "@/lib/db"
import { getLeagueBySlug } from "@/lib/get-league"
import { Goal, Trophy } from "lucide-react"
import { CategorySelector } from "@/components/public/category-selector"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { TeamLogo } from "@/components/ui/team-logo"

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ categoryId?: string }>
}

const positionBadge = (pos: number) => {
  if (pos === 1) return "bg-yellow-400/20 text-yellow-600 dark:text-yellow-400 ring-yellow-400/40"
  if (pos === 2) return "bg-gray-300/30 text-gray-500 dark:text-gray-400 ring-gray-400/30"
  if (pos === 3) return "bg-amber-500/20 text-amber-600 dark:text-amber-400 ring-amber-500/30"
  return "bg-muted/50 text-muted-foreground ring-border/50"
}

async function GoleadoresContent({ slug, categoryId }: { slug: string; categoryId?: string }) {
  const league = await getLeagueBySlug(slug)
  if (!league) notFound()

  const categories = await db.category.findMany({
    where: { leagueId: league.id },
    include: { league: { select: { name: true } } },
    orderBy: { name: "asc" },
  })

  let selectedCategory: (typeof categories)[0] | undefined
  if (categoryId) {
    selectedCategory = categories.find((c) => c.id === categoryId)
  } else if (categories.length > 0) {
    selectedCategory = categories[0]
  }

  const activeCategoryId = selectedCategory?.id

  type ScorerEntry = {
    playerId: string; playerName: string; playerSurname: string
    teamName: string; teamShortName: string; teamColor: string | null; teamLogoUrl: string | null
    totalGoals: number; position: number
  }

  let topScorers: ScorerEntry[] = []

  if (activeCategoryId) {
    const goalCounts = await db.goal.groupBy({
      by: ["playerId", "teamId"],
      where: { match: { categoryId: activeCategoryId, status: "FINISHED" }, isOwnGoal: false },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 20,
    })

    if (goalCounts.length > 0) {
      const playerIds = goalCounts.map((g) => g.playerId)
      const players: {
        id: string; name: string; surname: string
        team: { name: string; shortName: string; color: string | null; logoUrl: string | null } | null
      }[] = await db.player.findMany({
        where: { id: { in: playerIds } },
        select: { id: true, name: true, surname: true, team: { select: { name: true, shortName: true, color: true, logoUrl: true } } },
      })
      const playerMap = new Map(players.map((p) => [p.id, p]))

      topScorers = goalCounts.map((g, idx) => {
        const player = playerMap.get(g.playerId)
        return {
          playerId: g.playerId,
          playerName: player?.name ?? "",
          playerSurname: player?.surname ?? "",
          teamName: player?.team?.name ?? "",
          teamShortName: player?.team?.shortName ?? "",
          teamColor: player?.team?.color ?? null,
          teamLogoUrl: player?.team?.logoUrl ?? null,
          totalGoals: g._count.id,
          position: idx + 1,
        }
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
            {league.name} — Goleadores
          </h1>
          <p className="mt-1 text-muted-foreground">
            Temporada {league.season} &middot; Los máximos anotadores
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <CategorySelector categories={categories} basePath={`/liga/${slug}/goleadores`} />
        </div>
      </div>

      {!selectedCategory ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Goal className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">No hay categorías disponibles</p>
          <p className="mt-1 text-sm text-muted-foreground/60">Las categorías se muestran aquí una vez que el administrador las cree.</p>
        </div>
      ) : topScorers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Goal className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">Sin goles registrados</p>
          <p className="mt-1 text-sm text-muted-foreground/60">
            Aún no hay goles cargados en <span className="font-medium">{selectedCategory.name}</span>.
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
                  <TableHead>Jugador</TableHead>
                  <TableHead>Equipo</TableHead>
                  <TableHead className="w-24 text-center">Goles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topScorers.map((scorer, idx) => (
                  <TableRow key={scorer.playerId} className={cn("transition-colors hover:bg-muted/40", idx % 2 === 1 && "bg-muted/15", idx < 3 && "bg-gradient-to-r from-primary/5 to-transparent dark:from-primary/10", idx === 0 && "font-medium")}>
                    <TableCell className="text-center">
                      <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ring-1", positionBadge(scorer.position))}>{scorer.position}</span>
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/liga/${slug}/jugadores/${scorer.playerId}`} className="transition-colors hover:text-primary hover:underline">
                        {scorer.playerName} {scorer.playerSurname}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TeamLogo logoUrl={scorer.teamLogoUrl} color={scorer.teamColor} name={scorer.teamName} size="md" />
                        <span className="text-sm text-muted-foreground">{scorer.teamShortName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center rounded-full bg-primary/15 px-3 py-1 text-sm font-bold text-primary dark:bg-primary/25">{scorer.totalGoals}</span>
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
          <span className="inline-block h-2 w-2 rounded-full bg-primary/30" />
          Solo se contabilizan goles de partidos finalizados. No incluye goles en contra (e/c).
        </p>
      </div>
    </div>
  )
}

export default async function LeagueGoleadoresPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { categoryId } = await searchParams

  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
      <GoleadoresContent slug={slug} categoryId={categoryId} />
    </Suspense>
  )
}
