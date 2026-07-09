"use client"

import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MatchScheduleEditor } from "@/components/forms/match-schedule-editor"
import { getMatchesByRound } from "@/actions/match-order"
import { Loader2 } from "lucide-react"

interface Category {
  id: string
  name: string
  league: { name: string }
  _count: { teams: number; matches: number }
}

interface Props {
  categories: Category[]
}

export function ReorderClient({ categories }: Props) {
  const [categoryId, setCategoryId] = useState("")
  const [rounds, setRounds] = useState<Awaited<ReturnType<typeof getMatchesByRound>>["rounds"] | null>(null)
  const [loading, setLoading] = useState(false)

  const categoriesWithMatches = categories.filter((c) => c._count.matches > 0)

  function handleCategoryChange(value: string | null) {
    const id = value ?? ""
    setCategoryId(id)
    setRounds(null)
    if (!id) return

    setLoading(true)
    getMatchesByRound(id)
      .then((data) => setRounds(data.rounds))
      .catch(() => setRounds([]))
      .finally(() => setLoading(false))
  }

  return (
    <div className="space-y-6">
      <Select value={categoryId} onValueChange={handleCategoryChange}>
        <SelectTrigger className="w-full sm:w-80">
          <SelectValue placeholder="Seleccionar categoría...">
            {(value: string | null) => {
              if (!value) return "Seleccionar categoría..."
              const cat = categories.find((c) => c.id === value)
              return cat ? `${cat.name} — ${cat.league.name} (${cat._count.matches} partidos)` : null
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {categoriesWithMatches.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name} — {cat.league.name} ({cat._count.matches} partidos)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && categoryId && rounds && (
        <MatchScheduleEditor rounds={rounds} />
      )}

      {!loading && categoryId && rounds && rounds.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">
          No hay partidos en esta categoría.
        </p>
      )}
    </div>
  )
}
