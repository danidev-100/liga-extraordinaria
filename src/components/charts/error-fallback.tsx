"use client"

import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ChartErrorFallbackProps {
  title: string
}

/**
 * Custom ErrorBoundary fallback for chart sections.
 * Displays the chart name in the error message so the user
 * knows which section failed.
 */
export function ChartErrorFallback({ title }: ChartErrorFallbackProps) {
  return (
    <div className="flex h-[300px] flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-7 w-7 text-destructive" />
      </div>
      <p className="text-lg font-medium text-destructive">
        Error al cargar {title.toLowerCase()}
      </p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        No se pudieron obtener los datos. Intenta de nuevo más tarde.
      </p>
      <Button
        variant="outline"
        className="mt-4 gap-2"
        onClick={() => window.location.reload()}
      >
        <RefreshCw className="h-4 w-4" />
        Reintentar
      </Button>
    </div>
  )
}
