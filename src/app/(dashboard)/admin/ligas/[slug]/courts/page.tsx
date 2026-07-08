import Link from "next/link"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ensureScope } from "@/lib/ensure-scope"
import db from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit } from "lucide-react"
import { DeleteButton } from "@/components/forms/delete-button"
import { deleteCourt } from "@/actions/court"

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ScopedCourtsPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { slug } = await params
  await ensureScope(slug)

  // Courts are intentionally global — shared across all leagues
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
        <Link href={`/admin/courts/new`}>
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
