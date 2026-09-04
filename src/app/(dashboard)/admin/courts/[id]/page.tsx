import { notFound } from "next/navigation"
import db from "@/lib/db"
import { VenueForm } from "@/components/forms/venue-form"
import { VenueCourtsManager } from "@/components/forms/venue-courts-manager"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const venue = await db.venue.findUnique({
    where: { id },
    include: { courts: { orderBy: { name: "asc" } } },
  })

  if (!venue) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{venue.name}</h1>
        <p className="text-muted-foreground">
          {venue.city}
          {venue.address ? ` · ${venue.address}` : ""}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Editar Lugar</CardTitle>
        </CardHeader>
        <CardContent>
          <VenueForm
            initialData={{
              id: venue.id,
              name: venue.name,
              address: venue.address,
              city: venue.city,
              googleMapsLink: venue.googleMapsLink,
            }}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Canchas del lugar</CardTitle>
        </CardHeader>
        <VenueCourtsManager
          venueId={venue.id}
          courts={venue.courts.map((c) => ({ id: c.id, name: c.name, capacity: c.capacity }))}
          venueName={venue.name}
        />
      </Card>
    </div>
  )
}