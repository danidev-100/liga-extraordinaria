import { CourtForm } from "@/components/forms/court-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NewCourtPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nueva Cancha</h1>
        <p className="text-muted-foreground">
          Registrá una nueva cancha
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Datos de la cancha</CardTitle>
        </CardHeader>
        <CardContent>
          <CourtForm />
        </CardContent>
      </Card>
    </div>
  )
}
