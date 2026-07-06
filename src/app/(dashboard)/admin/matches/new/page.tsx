import { MatchForm } from "@/components/forms/match-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NewMatchPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo Partido</h1>
        <p className="text-muted-foreground">
          Programá un nuevo partido
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Datos del partido</CardTitle>
        </CardHeader>
        <CardContent>
          <MatchForm />
        </CardContent>
      </Card>
    </div>
  )
}
