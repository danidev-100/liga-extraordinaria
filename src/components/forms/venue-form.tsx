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
import { venueSchema, type VenueFormData } from "@/lib/validations/venue"
import { createVenue, updateVenue } from "@/actions/venue"

interface VenueFormProps {
  initialData?: {
    id: string
    name: string
    address: string | null
    city: string
    googleMapsLink: string | null
  }
}

export function VenueForm({ initialData }: VenueFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<VenueFormData>({
    resolver: zodResolver(venueSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          address: initialData.address ?? "",
          city: initialData.city,
          googleMapsLink: initialData.googleMapsLink ?? "",
        }
      : {
          name: "",
          address: "",
          city: "",
          googleMapsLink: "",
        },
  })

  async function onSubmit(data: VenueFormData) {
    setIsSubmitting(true)
    try {
      if (initialData) {
        await updateVenue(initialData.id, data)
        toast.success("Lugar actualizado exitosamente")
      } else {
        await createVenue(data)
        toast.success("Lugar creado exitosamente")
      }
      router.push("/admin/courts")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar el lugar")
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
                <Input placeholder="Estadio Monumental" {...field} />
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
        </div>
        <FormField
          control={form.control}
          name="googleMapsLink"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Google Maps</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://maps.app.goo.gl/..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Actualizar Lugar" : "Crear Lugar"}
        </Button>
      </form>
    </Form>
  )
}