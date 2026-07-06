import { notFound } from "next/navigation"
import db from "@/lib/db"
import { PlayerForm } from "@/components/forms/player-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function EditPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const player = await db.player.findUnique({
    where: { id },
  })

  if (!player) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar Jugador</h1>
        <p className="text-muted-foreground">
          Modificá los datos del jugador
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            {player.name} {player.surname}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PlayerForm
            initialData={{
              id: player.id,
              name: player.name,
              surname: player.surname,
              dni: player.dni,
              birthDate: player.birthDate,
              jerseyNumber: player.jerseyNumber,
              teamId: player.teamId,
              isActive: player.isActive,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
