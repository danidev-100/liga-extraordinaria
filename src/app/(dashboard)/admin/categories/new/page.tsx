import { CategoryForm } from "@/components/forms/category-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NewCategoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nueva Categoría</h1>
        <p className="text-muted-foreground">
          Creá una nueva categoría por edades
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Datos de la categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryForm />
        </CardContent>
      </Card>
    </div>
  )
}
