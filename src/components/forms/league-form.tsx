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
import { Loader2, ImageIcon } from "lucide-react"
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
    logoUrl: string | null
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
          logoUrl: initialData.logoUrl ?? "",
        }
      : {
          name: "",
          season: "",
          startDate: "",
          endDate: "",
          isActive: true,
          logoUrl: "",
        },
  })

  async function onSubmit(data: LeagueFormData) {
    setIsSubmitting(true)
    try {
      if (initialData) {
        await updateLeague(initialData.id, data)
        toast.success("Torneo actualizado exitosamente")
      } else {
        await createLeague(data)
        toast.success("Torneo creado exitosamente")
      }
      router.push("/admin/leagues")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar el torneo")
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
                <Input placeholder="Torneo Verano 2026" {...field} />
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
        <FormField
          control={form.control}
          name="logoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL del escudo</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <ImageIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="https://ejemplo.com/escudo.png"
                      className="pl-8"
                      {...field}
                    />
                  </div>
                  {field.value && (field.value.startsWith("/") || /^https?:\/\//.test(field.value)) && (
                    <img
                      src={field.value}
                      alt="Escudo del torneo"
                      className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-black/10"
                    />
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Actualizar Torneo" : "Crear Torneo"}
        </Button>
      </form>
    </Form>
  )
}
