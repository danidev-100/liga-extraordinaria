import Link from "next/link"
import { auth } from "@/lib/auth"
import db from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit } from "lucide-react"
import { DeleteButton } from "@/components/forms/delete-button"
import { deleteVenue } from "@/actions/venue"

export default async function VenuesPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const venues = await db.venue.findMany({
    include: { _count: { select: { courts: true } } },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-heading">Lugares</h1>
          <p className="text-muted-foreground">
            Gestioná los lugares y sus canchas
          </p>
        </div>
        <Link href="/admin/courts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Lugar
          </Button>
        </Link>
      </div>

      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle>Todos los lugares</CardTitle>
        </CardHeader>
        <CardContent>
          {venues.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay lugares registrados.
            </p>
          ) : (
            <div className="divide-y">
              {venues.map((venue) => (
                <div
                  key={venue.id}
                  className="flex items-center justify-between py-3 transition-colors hover:bg-muted/50 rounded-lg px-2 -mx-2"
                >
                  <div className="space-y-1 min-w-0">
                    <p className="font-medium truncate">{venue.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {venue.city}
                      {venue.address ? ` · ${venue.address}` : ""} · {venue._count.courts} cancha{venue._count.courts !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/courts/${venue.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <DeleteButton
                      action={deleteVenue.bind(null, venue.id)}
                      confirmMessage="¿Eliminar este lugar y sus canchas?"
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