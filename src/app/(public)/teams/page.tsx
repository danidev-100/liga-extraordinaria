import Link from "next/link"
import db from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import { TeamLogo } from "@/components/ui/team-logo"

export default async function TeamsPage() {
  const categories = await db.category.findMany({
    select: {
      id: true,
      name: true,
      league: { select: { name: true, season: true } },
      teams: {
        select: {
          id: true,
          name: true,
          shortName: true,
          color: true,
          logoUrl: true,
          _count: { select: { players: true } },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: [{ league: { name: "asc" } }, { name: "asc" }],
  })

  const totalTeams = categories.reduce((acc, cat) => acc + cat.teams.length, 0)

  if (categories.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">Equipos</h1>
        <p className="text-muted-foreground">No hay equipos registrados aún.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">Equipos</h1>
        <p className="mt-1 text-muted-foreground">
          {totalTeams} equipos en {categories.length} categorías
        </p>
      </div>

      {categories.map((category) => (
        <section key={category.id}>
          <h2 className="mb-4 font-heading text-xl font-semibold tracking-tight">
            {category.name}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              — {category.league.name} ({category.league.season})
            </span>
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {category.teams.map((team) => (
              <Link key={team.id} href={`/teams/${team.id}`} className="group">
                <Card className="h-full transition-all duration-200 hover:shadow-md hover:ring-2 hover:ring-primary/30">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <TeamLogo logoUrl={team.logoUrl} color={team.color} name={team.name} size="md" />
                      <div>
                        <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                          {team.name}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">{team.shortName}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <Users className="h-3 w-3" />
                      {team._count.players} jugadores
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
