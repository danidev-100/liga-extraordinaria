"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
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
  initialData?: {
    id: string
    name: string
    address: string | null
    city: string
    capacity: number | null
  }
}

export function CourtForm({ initialData }: CourtFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CourtFormData>({
    resolver: zodResolver(courtSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          address: initialData.address ?? "",
          city: initialData.city,
          capacity: initialData.capacity,
        }
      : {
          name: "",
          address: "",
          city: "",
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
        await createCourt(data)
        toast.success("Cancha creada exitosamente")
      }
      router.push("/admin/courts")
      router.refresh()
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
                <Input placeholder="Cancha Central" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ciudad *</FormLabel>
                <FormControl>
                  <Input placeholder="Buenos Aires" {...field} />
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
                    placeholder="500"
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
        </div>
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input placeholder="Av. Libertador 1234" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Actualizar Cancha" : "Crear Cancha"}
        </Button>
      </form>
    </Form>
  )
}
