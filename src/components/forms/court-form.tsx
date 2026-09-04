"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useState } from "react"
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
import { courtSchema, type CourtFormData } from "@/lib/validations/court"
import { createCourt, updateCourt } from "@/actions/court"

interface CourtFormProps {
  venueId: string
  initialData?: {
    id: string
    name: string
    capacity: number | null
  }
  onDone?: () => void
}

export function CourtForm({ venueId, initialData, onDone }: CourtFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CourtFormData>({
    resolver: zodResolver(courtSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          venueId,
          capacity: initialData.capacity,
        }
      : {
          name: "Cancha 1",
          venueId,
          capacity: null,
        },
  })

  async function onSubmit(data: CourtFormData) {
    setIsSubmitting(true)
    try {
      if (initialData) {
        await updateCourt(initialData.id, data)
        toast.success("Cancha actualizada exitosamente")
      } else {
        await createCourt({ ...data, venueId })
        toast.success("Cancha creada exitosamente")
      }
      onDone?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar la cancha")
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
                <Input placeholder="Cancha 1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacidad</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  placeholder="100"
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Actualizar Cancha" : "Agregar Cancha"}
        </Button>
      </form>
    </Form>
  )
}