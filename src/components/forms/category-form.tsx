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
import { categorySchema, type CategoryFormData } from "@/lib/validations/category"
import { createCategory, updateCategory } from "@/actions/category"
import { getLeagues } from "@/actions/league"

interface LeagueOption {
  id: string
  name: string
  season: string
}

interface CategoryFormProps {
  initialData?: {
    id: string
    name: string
    minAge: number
    maxAge: number
    leagueId: string
  }
}

export function CategoryForm({ initialData }: CategoryFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [leagues, setLeagues] = useState<LeagueOption[]>([])

  useEffect(() => {
    getLeagues().then(setLeagues).catch(console.error)
  }, [])

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          minAge: initialData.minAge,
          maxAge: initialData.maxAge,
          leagueId: initialData.leagueId,
        }
      : {
          name: "",
          minAge: 4,
          maxAge: 99,
          leagueId: "",
        },
  })

  async function onSubmit(data: CategoryFormData) {
    setIsSubmitting(true)
    try {
      if (initialData) {
        await updateCategory(initialData.id, data)
        toast.success("Categoría actualizada exitosamente")
      } else {
        await createCategory(data)
        toast.success("Categoría creada exitosamente")
      }
      router.push("/admin/categories")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar la categoría")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre *</FormLabel>
              <FormControl>
                <Input placeholder="U12" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="minAge"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Edad mínima *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={4}
                    max={100}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maxAge"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Edad máxima *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={4}
                    max={100}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="leagueId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Liga *</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar liga...">
                      {(value: string | null) => {
                        if (!value) return "Seleccionar liga..."
                        const league = leagues.find((l) => l.id === value)
                        return league ? `${league.name} (${league.season})` : null
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {leagues.map((league) => (
                      <SelectItem key={league.id} value={league.id}>
                        {league.name} ({league.season})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Actualizar Categoría" : "Crear Categoría"}
        </Button>
      </form>
    </Form>
  )
}
