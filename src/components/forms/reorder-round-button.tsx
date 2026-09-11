"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { RefreshCw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { reorderRound } from "@/actions/match-order"

interface ReorderRoundButtonProps {
  categoryId: string
  round: number
  /** League slug when rendered from a scoped admin page. */
  leagueSlug?: string
  /** Label for the round (e.g. "Reordenar jornada"). */
  label?: string
}

/**
 * Recalcula el fixture desde la jornada `round` hacia adelante, fijando la
 * jornada editada tal cual y reordenando las posteriores sin repetir cruces.
 */
export function ReorderRoundButton({
  categoryId,
  round,
  leagueSlug,
  label = "Reordenar jornada",
}: ReorderRoundButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (!confirm(`¿Reordenar el fixture desde la Jornada ${round}?\n\nLa Jornada ${round} queda como está y las siguientes se recalculan sin repetir cruces.`)) return
    setLoading(true)
    try {
      const result = await reorderRound(categoryId, round, leagueSlug)
      if (result.moved > 0) {
        toast.success(`Fixture reordenado: se reacomodaron ${result.moved} partido${result.moved !== 1 ? "s" : ""}`)
      } else {
        toast.success("El fixture ya estaba ordenado")
      }
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo reordenar el fixture")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className="gap-1.5"
      title={`Recalcula las jornadas posteriores a la ${round} sin repetir cruces`}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
      {label}
    </Button>
  )
}