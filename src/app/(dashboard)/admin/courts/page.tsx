import Link from "next/link"
import { auth } from "@/lib/auth"
import db from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit, MapPin } from "lucide-react"
import { DeleteButton } from "@/components/forms/delete-button"
import { deleteCourt } from "@/actions/court"

export default async function CourtsPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const courts = await db.court.findMany({
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-heading">Canchas</h1>
          <p className="text-muted-foreground">
            Gestioná las canchas disponibles
          </p>
        </div>
        <Link href="/admin/courts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Cancha
          </Button>
        </Link>
      </div>

      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle>Todas las canchas</CardTitle>
        </CardHeader>
        <CardContent>
          {courts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay canchas registradas.
            </p>
          ) : (
            <div className="divide-y">
              {courts.map((court) => (
                <div
                  key={court.id}
                  className="flex items-center justify-between py-3 transition-colors hover:bg-muted/50 rounded-lg px-2 -mx-2"
                >
                  <div className="space-y-1 min-w-0">
                    <p className="font-medium truncate">{court.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {court.city}
                      {court.address ? ` · ${court.address}` : ""}
                      {court.capacity ? ` · Cap. ${court.capacity}` : ""}
                      {court.googleMapsLink ? (
                        <>
                          {" · "}
                          <a
                            href={court.googleMapsLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            <MapPin className="h-3 w-3" />
                            Ver mapa
                          </a>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/courts/${court.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <DeleteButton
                      action={deleteCourt.bind(null, court.id)}
                      confirmMessage="¿Eliminar esta cancha?"
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
