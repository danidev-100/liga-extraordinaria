import { LeagueForm } from "@/components/forms/league-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NewLeaguePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nueva Liga</h1>
        <p className="text-muted-foreground">
          Creá una nueva liga o temporada
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Datos de la liga</CardTitle>
        </CardHeader>
        <CardContent>
          <LeagueForm />
        </CardContent>
      </Card>
    </div>
  )
}
