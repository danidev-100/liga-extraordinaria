import { notFound } from "next/navigation"
import db from "@/lib/db"
import { CategoryForm } from "@/components/forms/category-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const category = await db.category.findUnique({
    where: { id },
  })

  if (!category) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar Categoría</h1>
        <p className="text-muted-foreground">
          Modificá los datos de la categoría
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{category.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryForm
            initialData={{
              id: category.id,
              name: category.name,
              minAge: category.minAge,
              maxAge: category.maxAge,
              leagueId: category.leagueId,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
