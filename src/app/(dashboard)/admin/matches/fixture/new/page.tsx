import { auth } from "@/lib/auth"
import db from "@/lib/db"
import { FixtureForm } from "@/components/forms/fixture-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function NewFixturePage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const categories = await db.category.findMany({
    include: {
      league: { select: { name: true } },
      _count: { select: { teams: true } },
    },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Generar Temporada</h1>
        <p className="text-muted-foreground">
          Crea un fixture completo con todos los equipos de una categoría jugando entre sí
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Configuración de la temporada</CardTitle>
        </CardHeader>
        <CardContent>
          <FixtureForm categories={categories} />
        </CardContent>
      </Card>
    </div>
  )
}
