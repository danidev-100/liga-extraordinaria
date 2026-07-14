import { notFound } from "next/navigation"
import db from "@/lib/db"
import { TeamForm } from "@/components/forms/team-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TeamPlayerSection } from "@/components/public/team-player-section"

export default async function EditTeamPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const team = await db.team.findUnique({
    where: { id },
  })

  if (!team) {
    notFound()
  }

  const players = await db.player.findMany({
    where: { teamId: team.id },
    orderBy: [{ surname: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      surname: true,
      dni: true,
      jerseyNumber: true,
      isActive: true,
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar Equipo</h1>
        <p className="text-muted-foreground">
          Modificá los datos del equipo
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{team.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <TeamForm
            initialData={{
              id: team.id,
              name: team.name,
              shortName: team.shortName,
              color: team.color,
              logoUrl: team.logoUrl,
              categoryId: team.categoryId,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plantilla</CardTitle>
        </CardHeader>
        <CardContent>
          <TeamPlayerSection
            teamId={team.id}
            teamName={team.name}
            players={players}
          />
        </CardContent>
      </Card>
    </div>
  )
}
