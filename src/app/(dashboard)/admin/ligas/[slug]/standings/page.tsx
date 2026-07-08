"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2, RefreshCw, Trophy } from "lucide-react"
import { getCategoriesBySlug, getStandingsByCategory, recalculateStandings } from "@/actions/standings"
import { toast } from "sonner"
import { TeamLogo } from "@/components/ui/team-logo"
import { use } from "react"

interface CategoryOption {
  id: string
  name: string
  league: { name: string }
}

interface StandingEntry {
  id: string
  position: number
  pts: number
  pj: number
  pg: number
  pe: number
  pp: number
  gf: number
  gc: number
  dg: number
  ta: number
  tr: number
  team: { name: string; shortName: string; logoUrl: string | null; color: string | null }
}

interface Props {
  params: Promise<{ slug: string }>
}

export default function ScopedStandingsPage({ params }: Props) {
  const { slug } = use(params)

  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState("")
  const [standings, setStandings] = useState<StandingEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRecalculating, setIsRecalculating] = useState(false)

  // Load categories (scoped to league via slug)
  useEffect(() => {
    getCategoriesBySlug(slug)
      .then((data) => {
        setCategories(data as CategoryOption[])
        if (data.length > 0) {
          setSelectedCategoryId(data[0].id)
        }
      })
      .catch(console.error)
  }, [slug])

  const loadStandings = useCallback(async (categoryId: string) => {
    if (!categoryId) return
    setIsLoading(true)
    try {
      const data = await getStandingsByCategory(categoryId)
      setStandings(data as StandingEntry[])
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStandings(selectedCategoryId)
  }, [selectedCategoryId, loadStandings])

  async function handleRecalculate() {
    if (!selectedCategoryId) return
    setIsRecalculating(true)
    try {
      await recalculateStandings(selectedCategoryId, slug)
      await loadStandings(selectedCategoryId)
      toast.success("Posiciones recalculadas exitosamente")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al recalcular")
    } finally {
      setIsRecalculating(false)
    }
  }

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-heading">Posiciones</h1>
          <p className="text-muted-foreground">
            Tabla de posiciones por categoría
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRecalculate}
          disabled={isRecalculating || !selectedCategoryId}
        >
          {isRecalculating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Recalcular
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={selectedCategoryId}
          onValueChange={(value) => { if (value) setSelectedCategoryId(value) }}
        >
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue placeholder="Seleccionar categoría...">
              {(value: string | null) => {
                if (!value) return "Seleccionar categoría..."
                const cat = categories.find((c) => c.id === value)
                return cat ? `${cat.name} — ${cat.league.name}` : null
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name} — {cat.league.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            {selectedCategory
              ? `${selectedCategory.name} — ${selectedCategory.league.name}`
              : "Seleccioná una categoría"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : standings.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              {selectedCategoryId
                ? "No hay posiciones calculadas. Hacé clic en Recalcular."
                : "Seleccioná una categoría para ver las posiciones."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Equipo</TableHead>
                  <TableHead className="text-center">Pts</TableHead>
                  <TableHead className="text-center">PJ</TableHead>
                  <TableHead className="text-center">PG</TableHead>
                  <TableHead className="text-center">PE</TableHead>
                  <TableHead className="text-center">PP</TableHead>
                  <TableHead className="text-center">GF</TableHead>
                  <TableHead className="text-center">GC</TableHead>
                  <TableHead className="text-center">DG</TableHead>
                  <TableHead className="hidden sm:table-cell text-center">TA</TableHead>
                  <TableHead className="hidden sm:table-cell text-center">TR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standings.map((row, idx) => (
                  <TableRow
                    key={row.id}
                    className={idx < 3 ? "border-l-2 border-l-primary/30" : ""}
                  >
                    <TableCell className="font-medium">
                      {row.position <= 3 ? (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {row.position}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">{row.position}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        <TeamLogo logoUrl={row.team.logoUrl} color={row.team.color} name={row.team.name} size="md" />
                        {row.team.shortName}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-bold text-primary">{row.pts}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{row.pj}</TableCell>
                    <TableCell className="text-center">{row.pg}</TableCell>
                    <TableCell className="text-center">{row.pe}</TableCell>
                    <TableCell className="text-center">{row.pp}</TableCell>
                    <TableCell className="text-center">{row.gf}</TableCell>
                    <TableCell className="text-center">{row.gc}</TableCell>
                    <TableCell className="text-center">
                      <span
                        className={
                          row.dg > 0
                            ? "font-medium text-primary"
                            : row.dg < 0
                              ? "font-medium text-destructive"
                              : ""
                        }
                      >
                        {row.dg > 0 ? "+" : ""}{row.dg}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-center">
                      <span className="inline-flex items-center gap-1">
                        <span className="inline-block h-2 w-1.5 rounded-sm bg-yellow-400" />
                        {row.ta}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-center">
                      <span className="inline-flex items-center gap-1">
                        <span className="inline-block h-2 w-1.5 rounded-sm bg-red-500" />
                        {row.tr}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
