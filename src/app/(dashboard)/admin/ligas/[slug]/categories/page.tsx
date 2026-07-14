import Link from "next/link"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ensureScope } from "@/lib/ensure-scope"
import db from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, ToggleLeft, ToggleRight } from "lucide-react"
import { DeleteButton } from "@/components/forms/delete-button"
import { deleteCategory, toggleCategoryActive } from "@/actions/category"

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ScopedCategoriesPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { slug } = await params
  const { leagueId } = await ensureScope(slug)

  const allCategories = await db.category.findMany({
    where: { leagueId },
    include: {
      _count: { select: { teams: true, matches: true } },
    },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-heading">Categorías</h1>
          <p className="text-muted-foreground">
            Gestioná las categorías por edades
          </p>
        </div>
        <Link href={`/admin/categories/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Categoría
          </Button>
        </Link>
      </div>

      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle>Todas las categorías</CardTitle>
        </CardHeader>
        <CardContent>
          {allCategories.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay categorías registradas.
            </p>
          ) : (
            <div className="divide-y">
              {allCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between py-3 transition-colors hover:bg-muted/50 rounded-lg px-2 -mx-2"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="font-medium truncate">{cat.name}</p>
                      <Badge
                        variant={cat.isActive ? "default" : "secondary"}
                        className="shrink-0"
                      >
                        {cat.isActive ? "Activa" : "Inactiva"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      Edades: {cat.minAge} — {cat.maxAge} años ·{" "}
                      {cat._count.teams} equipos · {cat._count.matches} partidos
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <form
                      action={async () => {
                        "use server"
                        await toggleCategoryActive(cat.id, slug)
                      }}
                    >
                      <Button variant="outline" size="sm" type="submit">
                        {cat.isActive ? (
                          <ToggleRight className="h-4 w-4 text-primary" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </Button>
                    </form>
                    <Link href={`/admin/categories/${cat.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <DeleteButton
                      action={deleteCategory.bind(null, cat.id, slug)}
                      confirmMessage="¿Eliminar esta categoría?"
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
