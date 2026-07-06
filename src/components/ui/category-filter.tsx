"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

type Category = { id: string; name: string }

export function CategoryFilter({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get("categoryId") ?? ""

  function handleSelect(categoryId: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (categoryId) {
      params.set("categoryId", categoryId)
    } else {
      params.delete("categoryId")
    }
    // Preserve leagueId if set
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        onClick={() => handleSelect("")}
        className={cn(
          "rounded-full px-3.5 py-1 text-xs font-medium transition-colors",
          current === ""
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
      >
        Todas
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => handleSelect(cat.id)}
          className={cn(
            "rounded-full px-3.5 py-1 text-xs font-medium transition-colors",
            current === cat.id
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}
