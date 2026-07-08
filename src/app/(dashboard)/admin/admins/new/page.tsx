"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useState, useEffect } from "react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Copy, Check, Eye, EyeOff } from "lucide-react"
import { createAdminSchema, type CreateAdminData } from "@/lib/validations/admin"
import { createAdmin, getLeaguesForAdmin } from "@/actions/admin"

interface LeagueOption {
  id: string
  name: string
  season: string
  isActive: boolean
}

export default function NewAdminPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [leagues, setLeagues] = useState<LeagueOption[]>([])
  const [result, setResult] = useState<{ email: string; password: string; leagueName: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    getLeaguesForAdmin().then(setLeagues).catch(console.error)
  }, [])

  const form = useForm<CreateAdminData>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: {
      name: "",
      email: "",
      leagueId: "",
    },
  })

  async function onSubmit(data: CreateAdminData) {
    setIsSubmitting(true)
    try {
      const res = await createAdmin(data)
      setResult(res)
      toast.success("Administrador creado exitosamente")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear administrador")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (result) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Administrador creado</h1>
          <p className="text-muted-foreground">
            El usuario ya puede iniciar sesión con estas credenciales.
          </p>
        </div>
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Credenciales — {result.leagueName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</p>
                <p className="mt-1 text-sm font-mono font-medium">{result.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contraseña</p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="relative rounded bg-background px-2 py-1 text-sm font-mono font-medium">
                    {showPassword ? result.password : "••••••••"}
                  </code>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(result.password)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Copiar contraseña"
                  >
                    {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              ⚠️ Mostrá estas credenciales al administrador. No vamos a poder mostrarlas de nuevo.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => router.push("/admin/admins")}>
                Volver al listado
              </Button>
              <Button variant="outline" onClick={() => {
                setResult(null)
                form.reset()
              }}>
                Crear otro admin
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo Administrador</h1>
        <p className="text-muted-foreground">
          Creá un usuario para que administre una liga
        </p>
      </div>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Datos del administrador</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input placeholder="Carlos Gómez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="admin@ejemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar liga...">
                            {(value: string | null) => {
                              if (!value) return "Seleccionar liga..."
                              const league = leagues.find((l) => l.id === value)
                              return league ? `${league.name} (${league.season})` : null
                            }}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {leagues.length === 0 ? (
                            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                              No hay ligas disponibles
                            </div>
                          ) : (
                            leagues.map((league) => (
                              <SelectItem key={league.id} value={league.id}>
                                {league.name} ({league.season})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      La contraseña se va a generar automáticamente.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Administrador
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
