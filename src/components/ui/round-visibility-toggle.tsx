"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EyeOff } from "lucide-react"
import { setRoundVisibility } from "@/actions/round-visibility"
import { useRouter } from "next/navigation"

interface RoundVisibilityToggleProps {
  categoryId: string
  round: number
  hidden: boolean
  label?: string
}

export function RoundVisibilityToggle({ categoryId, round, hidden, label }: RoundVisibilityToggleProps) {
  const [isHidden, setIsHidden] = useState(hidden)
  const router = useRouter()

  async function handleToggle() {
    const next = !isHidden
    try {
      await setRoundVisibility(categoryId, round, next)
      toast.success(next ? "Jornada oculta" : "Jornada visible")
      setIsHidden(next)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar")
    }
  }

  return (
    <>
      {label && <span className="text-xs font-medium text-muted-foreground">{label}</span>}
      {isHidden ? (
        <>
          <Badge variant="secondary" className="gap-1">
            <EyeOff className="h-3 w-3" />
            Jornada oculta
          </Badge>
          <Button type="button" size="xs" variant="default" className="gap-1" onClick={handleToggle}>
            <EyeOff className="h-3 w-3" />
            Mostrar jornada
          </Button>
        </>
      ) : (
        <Button type="button" size="xs" variant="outline" className="gap-1" onClick={handleToggle}>
          <EyeOff className="h-3 w-3" />
          Ocultar jornada
        </Button>
      )}
    </>
  )
}