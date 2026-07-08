import Link from "next/link"
import { Trophy, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function GlobalNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
        <Trophy className="size-8 text-primary" />
      </div>
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Página no encontrada
        </h1>
        <p className="max-w-md text-muted-foreground">
          La página que buscás no existe o fue movida.
        </p>
      </div>
      <Link href="/">
        <Button className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Button>
      </Link>
    </div>
  )
}
