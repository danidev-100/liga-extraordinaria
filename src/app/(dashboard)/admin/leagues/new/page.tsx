import { LeagueForm } from "@/components/forms/league-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NewLeaguePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo Torneo</h1>
        <p className="text-muted-foreground">
          Creá un nuevo torneo o temporada
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Datos del torneo</CardTitle>
        </CardHeader>
        <CardContent>
          <LeagueForm />
        </CardContent>
      </Card>
    </div>
  )
}
