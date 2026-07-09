import Link from "next/link"
import { auth } from "@/lib/auth"
import db from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Upload } from "lucide-react"
import { CategoryFilter } from "@/components/ui/category-filter"
import { LeagueSelector } from "@/components/ui/league-selector"
import { PlayersTable } from "@/components/tables/players-table"
import { ImportPlayersCSV } from "@/components/forms/import-players-csv"

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string; leagueId?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) return null

  const { categoryId, leagueId } = await searchParams

  const leagues = await db.league.findMany({
    orderBy: { name: "asc" },
  })

  const categories = await db.category.findMany({
    where: leagueId ? { leagueId } : undefined,
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  const teams = await db.team.findMany({
    where: leagueId ? { category: { leagueId } } : undefined,
    include: { category: { select: { name: true } } },
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  })

  const players = await db.player.findMany({
    where: categoryId
      ? { team: { categoryId } }
      : leagueId
        ? { team: { category: { leagueId } } }
        : undefined,
      include: {
        team: {
          select: {
            name: true,
            shortName: true,
            logoUrl: true,
            color: true,
            category: { select: { name: true, id: true } },
          },
        },
        _count: { select: { goals: true, cards: true } },
      },
      orderBy: [{ surname: "asc" }, { name: "asc" }],
    })

  const selectedCategory = categories.find((c) => c.id === categoryId)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-heading">Jugadores</h1>
          <p className="text-muted-foreground">
            Gestioná los jugadores de cada equipo
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ImportPlayersCSV teams={teams.map(t => ({ id: t.id, name: t.name, shortName: t.shortName, category: t.category }))} />
          <Link href="/admin/players/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Jugador
            </Button>
          </Link>
        </div>
      </div>

      <LeagueSelector leagues={leagues} />

      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>
              {selectedCategory
                ? `Jugadores — ${selectedCategory.name}`
                : "Todos los jugadores"}
            </CardTitle>

            <CategoryFilter categories={categories} />
          </div>
        </CardHeader>
        <CardContent>
          <PlayersTable
            players={players.map((p) => ({
              id: p.id,
              name: p.name,
              surname: p.surname,
              dni: p.dni,
              birthDate: p.birthDate.toISOString(),
              jerseyNumber: p.jerseyNumber,
              isActive: p.isActive,
              teamName: p.team.name,
              teamShortName: p.team.shortName,
              teamLogoUrl: p.team.logoUrl,
              teamColor: p.team.color,
              categoryName: p.team.category.name,
              totalGoals: p._count.goals,
              totalCards: p._count.cards,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  )
}
