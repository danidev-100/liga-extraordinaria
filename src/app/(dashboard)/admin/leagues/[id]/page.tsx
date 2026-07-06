import { notFound } from "next/navigation"
import db from "@/lib/db"
import { LeagueForm } from "@/components/forms/league-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function EditLeaguePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const league = await db.league.findUnique({
    where: { id },
  })

  if (!league) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar Liga</h1>
        <p className="text-muted-foreground">
          Modificá los datos de la liga
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{league.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <LeagueForm
            initialData={{
              id: league.id,
              name: league.name,
              season: league.season,
              startDate: league.startDate,
              endDate: league.endDate,
              isActive: league.isActive,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
