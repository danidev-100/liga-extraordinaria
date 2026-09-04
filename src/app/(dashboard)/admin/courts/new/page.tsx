import { VenueForm } from "@/components/forms/venue-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NewVenuePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo Lugar</h1>
        <p className="text-muted-foreground">
          Registrá un nuevo lugar
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Datos del lugar</CardTitle>
        </CardHeader>
        <CardContent>
          <VenueForm />
        </CardContent>
      </Card>
    </div>
  )
}