import Link from "next/link"
import { auth } from "@/lib/auth"
import db from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit } from "lucide-react"
import { DeleteButton } from "@/components/forms/delete-button"
import { deletePlayer } from "@/actions/player"
import { Badge } from "@/components/ui/badge"
import { CategoryFilter } from "@/components/ui/category-filter"
import { LeagueSelector } from "@/components/ui/league-selector"

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
            category: { select: { name: true, id: true } },
          },
        },
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
          {players.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              {categoryId
                ? "No hay jugadores en esta categoría."
                : "No hay jugadores registrados."}
            </p>
          ) : (
            <div className="divide-y">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between py-3 transition-colors hover:bg-muted/50 rounded-lg px-2 -mx-2"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="font-medium truncate">
                        {player.name} {player.surname}
                      </p>
                      <Badge
                        variant={player.isActive ? "default" : "secondary"}
                        className="shrink-0"
                      >
                        {player.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                      {player.jerseyNumber && (
                        <Badge variant="outline" className="shrink-0">#{player.jerseyNumber}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      DNI: {player.dni} · {player.team.shortName} —{" "}
                      {player.team.category.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/players/${player.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <DeleteButton
                      action={deletePlayer.bind(null, player.id)}
                      confirmMessage="¿Eliminar este jugador?"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
