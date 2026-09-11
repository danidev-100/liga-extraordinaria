"use client"

import { useState } from "react"
import { toast } from "sonner"
import { UserX, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteMatch } from "@/actions/matches"

interface MakeFreeButtonProps {
  matchId: string
  localName: string
  visitorName: string
  leagueSlug?: string
}

/**
 * Quita un partido de la jornada: ambos equipos pasan a "libres".
 */
export function MakeFreeButton({ matchId, localName, visitorName, leagueSlug }: MakeFreeButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (!confirm(`¿Poner libre a ${localName} y ${visitorName}?\n\nSe elimina este partido de la jornada y ambos equipos quedan libres.`)) return
    setLoading(true)
    try {
      await deleteMatch(matchId, leagueSlug)
      toast.success(`${localName} y ${visitorName} quedaron libres`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo quitar el partido")
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
      title={`Quitar de la jornada (${localName} y ${visitorName} quedan libres)`}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserX className="h-3.5 w-3.5" />}
      Poner libre
    </Button>
  )
}