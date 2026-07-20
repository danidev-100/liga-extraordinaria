"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { RotateCcw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ResetCategoryButtonProps {
  action: () => Promise<void>
}

export function ResetCategoryButton({ action }: ResetCategoryButtonProps) {
  const router = useRouter()
  const [isResetting, setIsResetting] = useState(false)

  async function handleReset() {
    const confirmed = confirm(
      "¿Reiniciar categoría?\n\n" +
      "Esto va a BORRAR todos los partidos, goles, tarjetas y posiciones de esta categoría.\n" +
      "Los equipos y jugadores NO se van a borrar.\n\n" +
      "¿Estás seguro?",
    )
    if (!confirmed) return

    setIsResetting(true)
    try {
      await action()
      toast.success("Categoría reiniciada exitosamente")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al reiniciar la categoría")
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isResetting}
      onClick={handleReset}
      className="gap-1.5 text-amber-600 hover:text-amber-700 hover:border-amber-300"
    >
      {isResetting ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <RotateCcw className="h-3.5 w-3.5" />
      )}
      Reiniciar
    </Button>
  )
}
