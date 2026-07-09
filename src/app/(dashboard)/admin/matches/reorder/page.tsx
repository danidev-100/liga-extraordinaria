import { auth } from "@/lib/auth"
import db from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ReorderClient } from "./reorder-client"

export default async function ReorderPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const categories = await db.category.findMany({
    include: {
      league: { select: { name: true } },
      _count: { select: { teams: true, matches: true } },
    },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reordenar Partidos</h1>
        <p className="text-muted-foreground">
          Cambiá la fecha, hora o ronda de los partidos manualmente
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <ReorderClient categories={categories} />
        </CardContent>
      </Card>
    </div>
  )
}
