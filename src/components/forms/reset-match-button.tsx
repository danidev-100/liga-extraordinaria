"use client"

import { Button } from "@/components/ui/button"
import { RotateCcw } from "lucide-react"
import { resetMatch } from "@/actions/match-result"

interface ResetMatchButtonProps {
  matchId: string
  confirmMessage?: string
  label?: string
}

export function ResetMatchButton({
  matchId,
  confirmMessage = "¿Resetear el partido a Programado? Se borran goles, tarjetas y el resultado.",
  label = "Resetear partido",
}: ResetMatchButtonProps) {
  return (
    <form
      action={async () => {
        if (confirm(confirmMessage)) {
          await resetMatch(matchId)
        }
      }}
    >
      <Button variant="outline" size="sm" type="submit">
        <RotateCcw className="mr-1.5 h-4 w-4" />
        {label}
      </Button>
    </form>
  )
}