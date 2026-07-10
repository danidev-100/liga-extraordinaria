import Link from "next/link"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ensureScope } from "@/lib/ensure-scope"
import db from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { PlayersTable } from "@/components/tables/players-table"
import { ImportPlayersCSV } from "@/components/forms/import-players-csv"

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ categoryId?: string }>
}

export default async function ScopedPlayersPage({ params, searchParams }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { slug } = await params
  const { leagueId } = await ensureScope(slug)
  const { categoryId } = await searchParams

  const categories = await db.category.findMany({
    where: { leagueId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  const teams = await db.team.findMany({
    where: { category: { leagueId } },
    include: { category: { select: { name: true } } },
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  })

  const players = await db.player.findMany({
    where: categoryId
      ? { team: { categoryId } }
      : { team: { category: { leagueId } } },
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
          <Link href={`/admin/players/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Jugador
            </Button>
          </Link>
        </div>
      </div>

      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>
              {selectedCategory
                ? `Jugadores — ${selectedCategory.name}`
                : "Todos los jugadores"}
            </CardTitle>

            {/* Category filter */}
            <div className="flex flex-wrap gap-1.5">
              <Link
                href={`/admin/ligas/${slug}/players`}
                className={`rounded-full px-3.5 py-1 text-xs font-medium transition-colors ${
                  !categoryId
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Todas
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/admin/ligas/${slug}/players?categoryId=${cat.id}`}
                  className={`rounded-full px-3.5 py-1 text-xs font-medium transition-colors ${
                    categoryId === cat.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <PlayersTable
            leagueSlug={slug}
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
            teams={teams.map(t => ({ id: t.id, shortName: t.shortName, name: t.name }))}
          />
        </CardContent>
      </Card>
    </div>
  )
}
