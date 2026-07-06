"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useEffect, useState } from "react"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
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
import { Loader2 } from "lucide-react"
import { matchSchema, type MatchFormData } from "@/lib/validations/match"
import { createMatch, updateMatch, getMatchFormData } from "@/actions/matches"

interface CategoryOption {
  id: string
  name: string
  league: { name: string }
  teams: { id: string; name: string; shortName: string }[]
}

interface CourtOption {
  id: string
  name: string
}

interface MatchFormProps {
  initialData?: {
    id: string
    categoryId: string
    courtId: string
    date: Date
    time: string
    localTeamId: string
    visitorTeamId: string
    round: number
  }
}

export function MatchForm({ initialData }: MatchFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [courts, setCourts] = useState<CourtOption[]>([])

  useEffect(() => {
    getMatchFormData()
      .then((data) => {
        setCategories(data.categories)
        setCourts(data.courts)
      })
      .catch(console.error)
  }, [])

  const form = useForm<MatchFormData>({
    resolver: zodResolver(matchSchema),
    defaultValues: initialData
      ? {
          categoryId: initialData.categoryId,
          courtId: initialData.courtId,
          date: initialData.date.toISOString().split("T")[0],
          time: initialData.time,
          localTeamId: initialData.localTeamId,
          visitorTeamId: initialData.visitorTeamId,
          round: initialData.round,
        }
      : {
          categoryId: "",
          courtId: "",
          date: "",
          time: "",
          localTeamId: "",
          visitorTeamId: "",
          round: 1,
        },
  })

  const selectedCategoryId = form.watch("categoryId")
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId)
  const teams = selectedCategory?.teams ?? []

  async function onSubmit(data: MatchFormData) {
    setIsSubmitting(true)
    try {
      if (initialData) {
        await updateMatch(initialData.id, data)
        toast.success("Partido actualizado exitosamente")
      } else {
        await createMatch(data)
        toast.success("Partido creado exitosamente")
      }
      router.push("/admin/matches")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar el partido")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría *</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value)
                    // Reset team selections when category changes
                    form.setValue("localTeamId", "")
                    form.setValue("visitorTeamId", "")
                  }}
                >
                  <SelectTrigger className="w-full">
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
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora *</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="courtId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cancha *</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar cancha...">
                      {(value: string | null) => {
                        if (!value) return "Seleccionar cancha..."
                        const court = courts.find((c) => c.id === value)
                        return court ? court.name : null
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {courts.map((court) => (
                      <SelectItem key={court.id} value={court.id}>
                        {court.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="localTeamId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Equipo Local *</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!selectedCategoryId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          selectedCategoryId
                            ? "Seleccionar equipo local..."
                            : "Primero seleccioná una categoría"
                        }
                      >
                        {(value: string | null) => {
                          if (!value) return selectedCategoryId ? "Seleccionar equipo local..." : "Primero seleccioná una categoría"
                          const team = teams.find((t) => t.id === value)
                          return team ? `${team.shortName} — ${team.name}` : null
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.shortName} — {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="visitorTeamId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Equipo Visitante *</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!selectedCategoryId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          selectedCategoryId
                            ? "Seleccionar equipo visitante..."
                            : "Primero seleccioná una categoría"
                        }
                      >
                        {(value: string | null) => {
                          if (!value) return selectedCategoryId ? "Seleccionar equipo visitante..." : "Primero seleccioná una categoría"
                          const team = teams.find((t) => t.id === value)
                          return team ? `${team.shortName} — ${team.name}` : null
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.shortName} — {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="round"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ronda *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  placeholder="1"
                  value={field.value as number | string}
                  onChange={(e) =>
                    field.onChange(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  onBlur={field.onBlur}
                  ref={field.ref as React.Ref<HTMLInputElement>}
                  name={field.name}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Actualizar Partido" : "Crear Partido"}
        </Button>
      </form>
    </Form>
  )
}
