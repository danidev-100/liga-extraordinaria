"use client"

import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { buildScheduleHref } from "@/lib/schedule-params"

export function MatchRoundFilter({
  leagueSlug,
  fechas,
  currentFecha,
  categoryId,
  onSelect,
}: {
  leagueSlug: string
  fechas: number[]
  currentFecha?: number
  categoryId?: string
  onSelect?: (fecha: number | null) => void
}) {
  const router = useRouter()
  const basePath = `/liga/${leagueSlug}/partidos`

  function handleSelect(fecha: number | null) {
    if (onSelect) {
      onSelect(fecha)
      return
    }
    router.push(buildScheduleHref(basePath, { categoryId, fecha }))
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Fecha
      </span>
      <button
        onClick={() => handleSelect(null)}
        aria-pressed={currentFecha === undefined}
        className={cn(
          "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
          currentFecha === undefined
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-muted text-muted-foreground hover:bg-muted/80",
        )}
      >
        Todas
      </button>
      {fechas.map((fecha) => {
        const isActive = fecha === currentFecha
        return (
          <button
            key={fecha}
            onClick={() => handleSelect(fecha)}
            aria-pressed={isActive}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-all tabular-nums",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {fecha}
          </button>
        )
      })}
    </div>
  )
}
