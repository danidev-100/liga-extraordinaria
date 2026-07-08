"use client"

import Link from "next/link"
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-8 text-destructive" />
      </div>
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Error en el panel
        </h1>
        <p className="max-w-md text-muted-foreground">
          {error.message || "Ocurrió un error al cargar esta sección."}
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={reset} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </Button>
        <Link href="/admin">
          <Button variant="outline" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Ir al Dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}
