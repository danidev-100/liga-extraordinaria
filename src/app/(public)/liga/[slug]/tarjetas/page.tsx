export const dynamic = "force-dynamic"

import Link from "next/link"
import { notFound } from "next/navigation"
import db from "@/lib/db"
import { getLeagueBySlug } from "@/lib/get-league"
import { ShieldAlert } from "lucide-react"
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

async function TarjetasContent({ slug, categoryId }: { slug: string; categoryId?: string }) {
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

  const activeCategoryId = selectedCategory?.id

  type CardEntry = {
    playerId: string; playerName: string; playerSurname: string
    teamName: string; teamShortName: string; teamColor: string | null; teamLogoUrl: string | null
    yellowCards: number; redCards: number; totalCards: number; position: number
  }

  let cardsData: CardEntry[] = []

  if (activeCategoryId) {
    const yellowRaw = await db.card.groupBy({
      by: ["playerId", "teamId"],
      where: { match: { categoryId: activeCategoryId, status: "FINISHED" }, type: "YELLOW" },
      _count: { id: true },
    })
    const redRaw = await db.card.groupBy({
      by: ["playerId", "teamId"],
      where: { match: { categoryId: activeCategoryId, status: "FINISHED" }, type: "RED" },
      _count: { id: true },
    })
    const yellowCounts: { playerId: string; teamId: string; _count: { id: number } }[] = yellowRaw as any
    const redCounts: { playerId: string; teamId: string; _count: { id: number } }[] = redRaw as any

    const yellowMap = new Map(yellowCounts.map((c) => [c.playerId, c._count.id]))
    const redMap = new Map(redCounts.map((c) => [c.playerId, c._count.id]))
    const allPlayerIds = new Set([...yellowMap.keys(), ...redMap.keys()])

    if (allPlayerIds.size > 0) {
      const players: {
        id: string; name: string; surname: string
        team: { name: string; shortName: string; color: string | null; logoUrl: string | null } | null
      }[] = await db.player.findMany({
        where: { id: { in: Array.from(allPlayerIds) } },
        select: { id: true, name: true, surname: true, team: { select: { name: true, shortName: true, color: true, logoUrl: true } } },
      })
      const playerMap = new Map(players.map((p) => [p.id, p]))

      cardsData = Array.from(allPlayerIds)
        .map((playerId) => {
          const player = playerMap.get(playerId)
          const yellow = yellowMap.get(playerId) ?? 0
          const red = redMap.get(playerId) ?? 0
          return {
            playerId,
            playerName: player?.name ?? "",
            playerSurname: player?.surname ?? "",
            teamName: player?.team?.name ?? "",
            teamShortName: player?.team?.shortName ?? "",
            teamColor: player?.team?.color ?? null,
            teamLogoUrl: player?.team?.logoUrl ?? null,
            yellowCards: yellow,
            redCards: red,
            totalCards: yellow + red,
            position: 0,
          }
        })
        .filter((p) => p.totalCards > 0)
        .sort((a, b) => b.totalCards - a.totalCards || b.redCards - a.redCards)
        .map((entry, idx) => ({ ...entry, position: idx + 1 }))
    }
  }

  return (
    <div className="relative space-y-6">
      {/* Background image */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <img
          src="/falta.jpeg"
          alt=""
          className="h-full w-full object-cover object-center opacity-15"
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
            {league.name} — Tarjetas
          </h1>
          <p className="mt-1 text-muted-foreground">
            Temporada {league.season} &middot; Jugadores amonestados y expulsados
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <CategorySelector categories={categories} basePath={`/liga/${slug}/tarjetas`} />
        </div>
      </div>

      {!selectedCategory ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <ShieldAlert className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">No hay categorías disponibles</p>
          <p className="mt-1 text-sm text-muted-foreground/60">Las categorías se muestran aquí una vez que el administrador las cree.</p>
        </div>
      ) : cardsData.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <ShieldAlert className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">Sin tarjetas registradas</p>
          <p className="mt-1 text-sm text-muted-foreground/60">No hay tarjetas cargadas en <span className="font-medium">{selectedCategory.name}</span>.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b px-6 py-4">
            <ShieldAlert className="h-5 w-5 text-red-500" />
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
                  <TableHead className="w-28 text-center"><span className="inline-flex items-center gap-1.5 justify-center"><span className="inline-block h-3 w-2 rounded-sm bg-yellow-400 ring-1 ring-yellow-400/50" />Amarillas</span></TableHead>
                  <TableHead className="w-24 text-center"><span className="inline-flex items-center gap-1.5 justify-center"><span className="inline-block h-3 w-2 rounded-sm bg-red-500 ring-1 ring-red-500/50" />Rojas</span></TableHead>
                  <TableHead className="w-24 text-center">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cardsData.map((player, idx) => (
                  <TableRow key={player.playerId} className={cn("transition-colors hover:bg-muted/40", idx % 2 === 1 && "bg-muted/15", idx < 3 && "bg-gradient-to-r from-primary/5 to-transparent dark:from-primary/10")}>
                    <TableCell className="text-center">
                      <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ring-1", positionBadge(player.position))}>{player.position}</span>
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/liga/${slug}/jugadores/${player.playerId}`} className="transition-colors hover:text-primary hover:underline">
                        {player.playerName} {player.playerSurname}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TeamLogo logoUrl={player.teamLogoUrl} color={player.teamColor} name={player.teamName} size="md" />
                        <span className="text-sm text-muted-foreground">{player.teamShortName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                        <span className="inline-block h-2 w-1.5 rounded-sm bg-yellow-400 ring-1 ring-yellow-400/50" />
                        {player.yellowCards}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <span className="inline-block h-2 w-1.5 rounded-sm bg-red-500 ring-1 ring-red-500/50" />
                        {player.redCards}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">{player.totalCards}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-1.5 rounded-sm bg-yellow-400" /> Amarilla: amonestación</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-1.5 rounded-sm bg-red-500" /> Roja: expulsión</span>
          <span>Ordenado por total de tarjetas (mayor a menor).</span>
        </p>
      </div>
    </div>
  )
}

export default async function LeagueTarjetasPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { categoryId } = await searchParams

  return <TarjetasContent slug={slug} categoryId={categoryId} />
}
