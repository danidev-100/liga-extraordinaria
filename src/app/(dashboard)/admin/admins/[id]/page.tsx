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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Copy, Check, Eye, EyeOff, RotateCcw } from "lucide-react"
import { updateAdminSchema, type UpdateAdminData } from "@/lib/validations/admin"
import { getAdminById, updateAdmin, getLeaguesForAdmin, resetAdminPassword } from "@/actions/admin"
import { use } from "react"

interface LeagueOption {
  id: string
  name: string
  season: string
  isActive: boolean
}

interface AdminData {
  id: string
  name: string
  email: string
  role: string
  leagueId: string | null
  league: { id: string; name: string; slug: string; season: string } | null
}

export default function EditAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [admin, setAdmin] = useState<AdminData | null>(null)
  const [leagues, setLeagues] = useState<LeagueOption[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset password state
  const [resetResult, setResetResult] = useState<{ email: string; password: string } | null>(null)
  const [isResetting, setIsResetting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    Promise.all([
      getAdminById(id),
      getLeaguesForAdmin(),
    ]).then(([adminData, leaguesData]) => {
      if (!adminData) {
        toast.error("Administrador no encontrado")
        router.push("/admin/admins")
        return
      }
      setAdmin(adminData as AdminData)
      setLeagues(leaguesData)
      setLoading(false)
    }).catch(() => {
      toast.error("Error al cargar datos")
      router.push("/admin/admins")
    })
  }, [id, router])

  const form = useForm<UpdateAdminData>({
    resolver: zodResolver(updateAdminSchema),
    values: admin ? {
      name: admin.name,
      email: admin.email,
      leagueId: admin.leagueId ?? undefined,
    } : undefined,
  })

  async function onSubmit(data: UpdateAdminData) {
    setIsSubmitting(true)
    try {
      await updateAdmin(id, data)
      toast.success("Administrador actualizado exitosamente")
      router.push("/admin/admins")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleResetPassword() {
    setIsResetting(true)
    try {
      const result = await resetAdminPassword(id)
      setResetResult(result)
      toast.success("Contraseña reseteada")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al resetear contraseña")
    } finally {
      setIsResetting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!admin) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar Administrador</h1>
        <p className="text-muted-foreground">
          Modificá los datos del administrador
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Edit form */}
        <Card>
          <CardHeader>
            <CardTitle>{admin.name}</CardTitle>
            <CardDescription>{admin.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
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
                      <FormLabel>Liga</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value ?? ""}
                          onValueChange={(value) => field.onChange(value || undefined)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sin liga...">
                              {(value: string | null) => {
                                if (!value) return "Sin liga..."
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
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar cambios
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/admin/admins")}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Reset password */}
        <Card>
          <CardHeader>
            <CardTitle>Contraseña</CardTitle>
            <CardDescription>
              Resetear la contraseña del administrador
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Se va a generar una nueva contraseña automáticamente. La actual va a dejar de funcionar.
            </p>

            {resetResult ? (
              <div className="rounded-lg border-2 border-primary/20 bg-muted p-4 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nueva contraseña</p>
                <div className="flex items-center gap-2">
                  <code className="relative rounded bg-background px-2 py-1 text-sm font-mono font-medium">
                    {showPassword ? resetResult.password : "••••••••"}
                  </code>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Ocultar" : "Mostrar"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(resetResult.password)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Copiar"
                  >
                    {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  ⚠️ Mostrásela al administrador. No se va a poder ver de nuevo.
                </p>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={handleResetPassword}
                disabled={isResetting}
                className="w-full"
              >
                {isResetting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="mr-2 h-4 w-4" />
                )}
                Resetear contraseña
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
