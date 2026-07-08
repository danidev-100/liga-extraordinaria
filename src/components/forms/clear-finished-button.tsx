"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { clearFinishedMatches } from "@/actions/matches"

export function ClearFinishedButton({ slug }: { slug?: string }) {
  const router = useRouter()
  const [isClearing, setIsClearing] = useState(false)

  async function handleClear() {
    const confirmed = confirm(
      "¿Eliminar TODOS los partidos finalizados?\n\n" +
      "Esto también borrará goles, tarjetas y las posiciones asociadas.\n" +
      "Los partidos programados no se verán afectados.",
    )
    if (!confirmed) return

    setIsClearing(true)
    try {
      const result = await clearFinishedMatches(slug ?? "")
      toast.success(
        result.count > 0
          ? `${result.count} partido(s) finalizado(s) eliminados`
          : "No hay partidos finalizados para limpiar",
      )
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al limpiar")
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <Button
      type="button"
      variant="destructive"
      disabled={isClearing}
      className="gap-2"
      onClick={handleClear}
    >
      {isClearing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
      {isClearing ? "Limpiando..." : "Limpiar Finalizados"}
    </Button>
  )
}
