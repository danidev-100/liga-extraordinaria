import { TeamForm } from "@/components/forms/team-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NewTeamPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo Equipo</h1>
        <p className="text-muted-foreground">
          Creá un nuevo equipo
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Datos del equipo</CardTitle>
        </CardHeader>
        <CardContent>
          <TeamForm />
        </CardContent>
      </Card>
    </div>
  )
}
