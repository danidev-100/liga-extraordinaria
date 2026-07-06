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
import { playerSchema, type PlayerFormData } from "@/lib/validations/player"
import { createPlayer, updatePlayer } from "@/actions/player"
import { getTeams } from "@/actions/team"

interface TeamOption {
  id: string
  name: string
  shortName: string
  category: { name: string }
}

interface PlayerFormProps {
  initialData?: {
    id: string
    name: string
    surname: string
    dni: string
    birthDate: Date
    jerseyNumber: number | null
    teamId: string
    isActive: boolean
  }
}

export function PlayerForm({ initialData }: PlayerFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [teams, setTeams] = useState<TeamOption[]>([])

  useEffect(() => {
    getTeams().then(setTeams).catch(console.error)
  }, [])

  const form = useForm<PlayerFormData>({
    resolver: zodResolver(playerSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          surname: initialData.surname,
          dni: initialData.dni,
          birthDate: initialData.birthDate.toISOString().split("T")[0],
          jerseyNumber: initialData.jerseyNumber,
          teamId: initialData.teamId,
          isActive: initialData.isActive,
        }
      : {
          name: "",
          surname: "",
          dni: "",
          birthDate: "",
          jerseyNumber: null,
          teamId: "",
          isActive: true,
        },
  })

  async function onSubmit(data: PlayerFormData) {
    setIsSubmitting(true)
    try {
      if (initialData) {
        await updatePlayer(initialData.id, data)
        toast.success("Jugador actualizado exitosamente")
      } else {
        await createPlayer(data)
        toast.success("Jugador creado exitosamente")
      }
      router.push("/admin/players")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar el jugador")
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
                  <Input placeholder="Juan" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="surname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellido *</FormLabel>
                <FormControl>
                  <Input placeholder="Pérez" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="dni"
            render={({ field }) => (
              <FormItem>
                <FormLabel>DNI *</FormLabel>
                <FormControl>
                  <Input placeholder="12345678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de nacimiento *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="jerseyNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de camiseta</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={99}
                    placeholder="10"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? null : Number(e.target.value)
                      )
                    }
                    onBlur={field.onBlur}
                    ref={field.ref}
                    name={field.name}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="teamId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Equipo *</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar equipo...">
                        {(value: string | null) => {
                          if (!value) return "Seleccionar equipo..."
                          const team = teams.find((t) => t.id === value)
                          return team ? `${team.shortName} — ${team.category.name}` : null
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.shortName} — {team.category.name}
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Actualizar Jugador" : "Crear Jugador"}
        </Button>
      </form>
    </Form>
  )
}
