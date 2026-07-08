import Link from "next/link"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ensureScope } from "@/lib/ensure-scope"
import db from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit } from "lucide-react"
import { DeleteButton } from "@/components/forms/delete-button"
import { deleteTeam } from "@/actions/team"
import { Badge } from "@/components/ui/badge"
import { TeamLogo } from "@/components/ui/team-logo"

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ categoryId?: string }>
}

export default async function ScopedTeamsPage({ params, searchParams }: Props) {
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
    where: categoryId ? { categoryId } : { category: { leagueId } },
    include: {
      category: {
        select: { name: true, league: { select: { name: true } } },
      },
      _count: { select: { players: true } },
    },
    orderBy: { name: "asc" },
  })

  const selectedCategory = categories.find((c) => c.id === categoryId)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-heading">Equipos</h1>
          <p className="text-muted-foreground">
            Gestioná los equipos de cada categoría
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/admin/ligas/${slug}/teams/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Equipo
            </Button>
          </Link>
        </div>
      </div>

      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>
              {selectedCategory
                ? `Equipos — ${selectedCategory.name}`
                : "Todos los equipos"}
            </CardTitle>

            {/* Category filter */}
            <div className="flex flex-wrap gap-1.5">
              <Link
                href={`/admin/ligas/${slug}/teams`}
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
                  href={`/admin/ligas/${slug}/teams?categoryId=${cat.id}`}
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
          {teams.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              {categoryId
                ? "No hay equipos en esta categoría."
                : "No hay equipos registrados."}
            </p>
          ) : (
            <div className="divide-y">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between py-3 transition-colors hover:bg-muted/50 rounded-lg px-2 -mx-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <TeamLogo logoUrl={team.logoUrl} color={team.color} name={team.name} size="md" />
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <Link
                          href={`/teams/${team.id}`}
                          className="font-medium truncate hover:underline transition-colors"
                        >
                          {team.name}
                        </Link>
                        <Badge variant="outline" className="shrink-0">{team.shortName}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {team.category.name} — {team.category.league.name} ·{" "}
                        {team._count.players} jugadores
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/ligas/${slug}/teams/${team.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <DeleteButton
                      action={deleteTeam.bind(null, team.id, slug)}
                      confirmMessage="¿Eliminar este equipo?"
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
