import Link from "next/link"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ensureScope } from "@/lib/ensure-scope"
import db from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Edit, ToggleLeft, ToggleRight, Plus } from "lucide-react"
import { toggleLeagueActive } from "@/actions/league"
import { Badge } from "@/components/ui/badge"

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ScopedLeaguesPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { slug } = await params
  const { leagueId, isSuperAdmin } = await ensureScope(slug)

  // Scoped to only the user's league
  const league = await db.league.findUnique({
    where: { id: leagueId },
  })

  if (!league) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-heading">Torneo</h1>
        <p className="text-muted-foreground">Torneo no encontrado.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-heading">Mi Torneo</h1>
          <p className="text-muted-foreground">
            Configuración de tu torneo
          </p>
        </div>
        {isSuperAdmin && (
          <Link href="/admin/leagues/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Torneo
            </Button>
          </Link>
        )}
      </div>

      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle>Detalle del torneo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-3 transition-colors hover:bg-muted/50 rounded-lg px-2 -mx-2">
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
                {league.slug ? ` · slug: ${league.slug}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <form
                action={async () => {
                  "use server"
                  await toggleLeagueActive(league.id, slug)
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
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
