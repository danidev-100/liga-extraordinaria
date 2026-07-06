"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

interface CategoryOption {
  id: string
  name: string
  league: { name: string }
}

export function CategorySelector({
  categories,
  basePath = "/standings",
}: {
  categories: CategoryOption[]
  basePath?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentId = searchParams.get("categoryId") || ""

  function handleSelect(categoryId: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (categoryId) {
      params.set("categoryId", categoryId)
    } else {
      params.delete("categoryId")
    }
    // Preserve leagueId if set
    router.push(`${basePath}?${params.toString()}`)
  }

  if (categories.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        onClick={() => handleSelect(null)}
        className={cn(
          "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
          !currentId
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-muted text-muted-foreground hover:bg-muted/80",
        )}
      >
        Todas
      </button>
      {categories.map((cat) => {
        const isActive = cat.id === currentId
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
