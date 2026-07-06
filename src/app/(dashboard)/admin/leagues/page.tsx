import Link from "next/link"
import { auth } from "@/lib/auth"
import db from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit, ToggleLeft, ToggleRight } from "lucide-react"
import { DeleteButton } from "@/components/forms/delete-button"
import { deleteLeague, toggleLeagueActive } from "@/actions/league"
import { Badge } from "@/components/ui/badge"

export default async function LeaguesPage() {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }

  const leagues = await db.league.findMany({
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-heading">Ligas</h1>
          <p className="text-muted-foreground">
            Gestioná las ligas y temporadas
          </p>
        </div>
        <Link href="/admin/leagues/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Liga
          </Button>
        </Link>
      </div>

      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle>Todas las ligas</CardTitle>
        </CardHeader>
        <CardContent>
          {leagues.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay ligas registradas. Creá la primera liga.
            </p>
          ) : (
            <div className="divide-y">
              {leagues.map((league) => (
                <div
                  key={league.id}
                  className="flex items-center justify-between py-3 transition-colors hover:bg-muted/50 rounded-lg px-2 -mx-2"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="font-medium truncate">{league.name}</p>
                      <Badge
                        variant={league.isActive ? "default" : "secondary"}
                        className="shrink-0"
                      >
                        {league.isActive ? "Activa" : "Inactiva"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      Temporada {league.season} ·{" "}
                      {new Date(league.startDate).toLocaleDateString("es-AR")} —{" "}
                      {new Date(league.endDate).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <form
                      action={async () => {
                        "use server"
                        await toggleLeagueActive(league.id)
                      }}
                    >
                      <Button variant="outline" size="sm" type="submit">
                        {league.isActive ? (
                          <ToggleRight className="h-4 w-4 text-primary" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </Button>
                    </form>
                    <Link href={`/admin/leagues/${league.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <DeleteButton
                      action={deleteLeague.bind(null, league.id)}
                      confirmMessage="¿Eliminar esta liga?"
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
