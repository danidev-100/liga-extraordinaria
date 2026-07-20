"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

type League = { id: string; name: string; season: string }

export function LeagueSelector({ leagues }: { leagues: League[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentLeagueId = searchParams.get("leagueId") ?? ""

  function handleSelect(leagueId: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (leagueId) {
      params.set("leagueId", leagueId)
    } else {
      params.delete("leagueId")
    }
    // Reset category when league changes — categories are scoped per league
    params.delete("categoryId")
    router.push(`?${params.toString()}`)
  }

  if (leagues.length <= 1) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        onClick={() => handleSelect("")}
        className={cn(
          "rounded-full px-3.5 py-1 text-xs font-medium transition-colors",
          currentLeagueId === ""
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80",
        )}
      >
        Todos los Torneos
      </button>
      {leagues.map((league) => {
        const isActive = league.id === currentLeagueId
        return (
          <button
            key={league.id}
            onClick={() => handleSelect(league.id)}
            className={cn(
              "rounded-full px-3.5 py-1 text-xs font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {league.name}
            <span className="ml-1 text-[10px] opacity-70">({league.season})</span>
          </button>
        )
      })}
    </div>
  )
}
