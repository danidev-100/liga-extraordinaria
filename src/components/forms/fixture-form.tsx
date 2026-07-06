"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar, Loader2, AlertTriangle } from "lucide-react"
import { generateRoundRobin } from "@/actions/matches"

const fixtureSchema = z.object({
  categoryId: z.string().uuid("Debe seleccionar una categoría"),
  startDate: z.string().min(1, "La fecha de inicio es requerida"),
  baseTime: z.string().min(1, "El horario base es requerido"),
})

type FixtureData = z.infer<typeof fixtureSchema>

interface FixtureFormProps {
  categories: {
    id: string
    name: string
    league: { name: string }
    _count: { teams: number }
  }[]
}

export function FixtureForm({ categories }: FixtureFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FixtureData>({
    resolver: zodResolver(fixtureSchema),
    defaultValues: {
      categoryId: "",
      startDate: "",
      baseTime: "14:00",
    },
  })

  const selectedCategoryId = form.watch("categoryId")
  const selectedCat = categories.find((c) => c.id === selectedCategoryId)
  const teamCount = selectedCat?._count.teams ?? 0
  const rounds = teamCount >= 3 ? (teamCount % 2 === 0 ? teamCount - 1 : teamCount) : 0
  const matchesPerRound = Math.floor(teamCount / 2)
  const totalMatches = rounds * matchesPerRound

  async function onSubmit(data: FixtureData) {
    if (teamCount < 3) {
      toast.error("Se necesitan al menos 3 equipos en la categoría")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await generateRoundRobin({
        categoryId: data.categoryId,
        startDate: data.startDate,
        baseTime: data.baseTime,
      })

      toast.success(
        `Fixture generado: ${result.totalRounds} fechas, ${result.totalMatches} partidos`,
        { duration: 5000 },
      )
      router.push("/admin/matches")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al generar el fixture")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Category selector */}
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría *</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar categoría...">
                      {(value: string | null) => {
                        if (!value) return "Seleccionar categoría..."
                        const cat = categories.find((c) => c.id === value)
                        return cat ? `${cat.name} — ${cat.league.name} (${cat._count.teams} equipos)` : null
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name} — {cat.league.name} ({cat._count.teams} equipos)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Season preview */}
        {selectedCat && teamCount >= 3 && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm dark:border-green-900 dark:bg-green-950/30">
            <div className="flex items-center gap-2 font-medium text-green-800 dark:text-green-300">
              <Calendar className="h-4 w-4" />
              Temporada completa
            </div>
            <ul className="mt-2 space-y-1 text-green-700 dark:text-green-400">
              <li>{teamCount} equipos — todos contra todos</li>
              <li>{rounds} fechas de {matchesPerRound} partidos cada una</li>
              <li><strong>{totalMatches} partidos</strong> en total</li>
              <li>Las fechas se espacian 7 días</li>
              <li>Los partidos de una misma fecha se escalonan cada 2 horas</li>
            </ul>
          </div>
        )}

        {selectedCat && teamCount < 3 && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Se necesitan al menos 3 equipos en esta categoría
          </div>
        )}

        {/* Date & time */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de inicio *</FormLabel>
                <FormDescription>Primera fecha del torneo</FormDescription>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="baseTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horario base *</FormLabel>
                <FormDescription>Primer partido de cada fecha</FormDescription>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || teamCount < 3}
          className="w-full gap-2 sm:w-auto"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Calendar className="h-4 w-4" />
          )}
          {isSubmitting
            ? "Generando temporada..."
            : `Generar Temporada Completa (${totalMatches} partidos)`}
        </Button>
      </form>
    </Form>
  )
}
