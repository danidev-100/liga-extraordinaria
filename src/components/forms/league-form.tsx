"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
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
import { Loader2 } from "lucide-react"
import { leagueSchema, type LeagueFormData } from "@/lib/validations/league"
import { createLeague, updateLeague } from "@/actions/league"
import { useState } from "react"

interface LeagueFormProps {
  initialData?: {
    id: string
    name: string
    season: string
    startDate: Date
    endDate: Date
    isActive: boolean
  }
}

export function LeagueForm({ initialData }: LeagueFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<LeagueFormData>({
    resolver: zodResolver(leagueSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          season: initialData.season,
          startDate: initialData.startDate.toISOString().split("T")[0],
          endDate: initialData.endDate.toISOString().split("T")[0],
          isActive: initialData.isActive,
        }
      : {
          name: "",
          season: "",
          startDate: "",
          endDate: "",
          isActive: false,
        },
  })

  async function onSubmit(data: LeagueFormData) {
    setIsSubmitting(true)
    try {
      if (initialData) {
        await updateLeague(initialData.id, data)
        toast.success("Liga actualizada exitosamente")
      } else {
        await createLeague(data)
        toast.success("Liga creada exitosamente")
      }
      router.push("/admin/leagues")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar la liga")
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
                <Input placeholder="Liga Verano 2026" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="season"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Temporada *</FormLabel>
              <FormControl>
                <Input placeholder="2026" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de inicio *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de fin *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Actualizar Liga" : "Crear Liga"}
        </Button>
      </form>
    </Form>
  )
}
