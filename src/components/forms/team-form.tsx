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
import { Loader2, ImageIcon } from "lucide-react"
import { TeamLogo } from "@/components/ui/team-logo"
import { teamSchema, type TeamFormData } from "@/lib/validations/team"
import { createTeam, updateTeam } from "@/actions/team"
import { getCategories } from "@/actions/category"

interface CategoryOption {
  id: string
  name: string
  league: { name: string }
}

interface TeamFormProps {
  initialData?: {
    id: string
    name: string
    shortName: string
    color: string | null
    logoUrl: string | null
    categoryId: string
  }
}

export function TeamForm({ initialData }: TeamFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<CategoryOption[]>([])

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error)
  }, [])

  const form = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          shortName: initialData.shortName,
          color: initialData.color ?? "",
          logoUrl: initialData.logoUrl ?? "",
          categoryId: initialData.categoryId,
        }
      : {
          name: "",
          shortName: "",
          color: "",
          logoUrl: "",
          categoryId: "",
        },
  })

  async function onSubmit(data: TeamFormData) {
    setIsSubmitting(true)
    try {
      if (initialData) {
        await updateTeam(initialData.id, data)
        toast.success("Equipo actualizado exitosamente")
      } else {
        await createTeam(data)
        toast.success("Equipo creado exitosamente")
      }
      router.push("/admin/teams")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar el equipo")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre *</FormLabel>
                <FormControl>
                  <Input placeholder="Real FC" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shortName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre corto *</FormLabel>
                <FormControl>
                  <Input placeholder="RFC" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color (hex)</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input placeholder="#FF0000" {...field} />
                  {field.value && /^#[0-9a-fA-F]{6}$/.test(field.value) && (
                    <div
                      className="h-8 w-8 rounded-md border"
                      style={{ backgroundColor: field.value }}
                    />
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
                  {field.value && /^https?:\/\/.+\./.test(field.value) && (
                    <TeamLogo
                      logoUrl={field.value}
                      color={form.watch("color") || null}
                      name={form.watch("name") || "Escudo"}
                      size="md"
                    />
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría *</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Actualizar Equipo" : "Crear Equipo"}
        </Button>
      </form>
    </Form>
  )
}
