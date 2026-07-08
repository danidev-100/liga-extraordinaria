"use client"

import { useRouter } from "next/navigation"
import { ChevronDown, Trophy } from "lucide-react"

interface League {
  id: string
  name: string
  slug: string | null
  season: string
}

interface LeagueSwitcherProps {
  leagues: League[]
  currentSlug?: string
  currentName?: string | null
}

export function LeagueSwitcher({ leagues, currentSlug, currentName }: LeagueSwitcherProps) {
  const router = useRouter()

  if (leagues.length === 0) return null

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-1 text-sm font-bold tracking-tight text-sidebar-primary-foreground hover:text-sidebar-primary-foreground/80 transition-colors"
        aria-label="Cambiar de liga"
      >
        <Trophy className="size-4 shrink-0" />
        <span className="truncate max-w-[120px]">{currentName ?? "Liga Deportiva"}</span>
        <ChevronDown className="size-3 shrink-0 opacity-70" />
      </button>

      {/* Dropdown */}
      <div className="absolute left-0 top-full mt-1 w-56 origin-top-left rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 opacity-0 invisible group-focus-within:opacity-100 group-focus-within:visible group-hover:opacity-100 group-hover:visible transition-all duration-100 z-50">
        <div className="p-1">
          <div className="px-1.5 py-1 text-xs font-medium text-muted-foreground">
            Todas las ligas
          </div>
          {leagues.map((league) => {
            const isActive = league.slug === currentSlug
            return (
              <button
                key={league.id}
                onClick={() => {
                  if (league.slug) router.push(`/admin/ligas/${league.slug}`)
                }}
                className="flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
                data-active={isActive || undefined}
                disabled={!league.slug}
              >
                <span className="flex-1 text-left truncate">{league.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {league.season}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
