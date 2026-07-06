import { PlayerForm } from "@/components/forms/player-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NewPlayerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo Jugador</h1>
        <p className="text-muted-foreground">
          Registrá un nuevo jugador
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Datos del jugador</CardTitle>
        </CardHeader>
        <CardContent>
          <PlayerForm />
        </CardContent>
      </Card>
    </div>
  )
}
