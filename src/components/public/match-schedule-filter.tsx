"use client"

import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface CategoryOption {
  id: string
  name: string
  league: { name: string }
}

export function MatchScheduleFilter({
  categories,
  currentCategoryId,
}: {
  categories: CategoryOption[]
  currentCategoryId?: string
}) {
  const router = useRouter()

  function handleSelect(categoryId: string | null) {
    if (!categoryId) {
      router.push("/matches")
      return
    }
    router.push(`/matches?categoryId=${categoryId}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        onClick={() => handleSelect(null)}
        className={cn(
          "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
          !currentCategoryId
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-muted text-muted-foreground hover:bg-muted/80",
        )}
      >
        Todas
      </button>
      {categories.map((cat) => {
        const isActive = cat.id === currentCategoryId
        return (
          <button
            key={cat.id}
            onClick={() => handleSelect(cat.id)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-all max-w-[180px] truncate",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {cat.name}{" "}
            <span className="text-[11px] opacity-70 truncate">
              — {cat.league.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}
