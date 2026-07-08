import { notFound } from "next/navigation"
import db from "@/lib/db"
import { CourtForm } from "@/components/forms/court-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function EditCourtPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const court = await db.court.findUnique({
    where: { id },
  })

  if (!court) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar Cancha</h1>
        <p className="text-muted-foreground">
          Modificá los datos de la cancha
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{court.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <CourtForm
            initialData={{
              id: court.id,
              name: court.name,
              address: court.address,
              city: court.city,
              capacity: court.capacity,
              googleMapsLink: court.googleMapsLink,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
