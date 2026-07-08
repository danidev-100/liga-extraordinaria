"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Trophy, Eye, EyeOff, UserPlus, Shield, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { register } from "@/actions/auth"
import Link from "next/link"

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const form = e.currentTarget
    const data = new FormData(form)
    const password = data.get("password") as string
    const confirm = data.get("confirmPassword") as string

    if (password !== confirm) {
      setError("Las contraseñas no coinciden")
      setLoading(false)
      return
    }

    const result = await register(data)
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    // Auto sign-in after successful registration
    const signInResult = await signIn("credentials", {
      email: result.email,
      password: result.password,
      redirect: false,
    })

    if (signInResult?.error) {
      setError("Cuenta creada. Por favor, iniciá sesión.")
      setLoading(false)
      return
    }

    // Redirect to the new league's admin dashboard
    router.push(`/admin/ligas/${result.slug}/dashboard`)
    router.refresh()
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4 dark:from-green-950 dark:via-zinc-950 dark:to-emerald-950">
      {/* Background decorations */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl dark:bg-primary/10" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/10" />
        <svg className="absolute inset-0 h-full w-full opacity-[0.02] dark:opacity-[0.04]">
          <defs>
            <pattern id="grid-sm" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-sm)" />
        </svg>
      </div>

      <div className="relative w-full max-w-md">
        {/* Branding */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
            <Trophy className="h-6 w-6 text-primary-foreground" />
          </div>
          <h2 className="font-heading text-xl font-bold tracking-wide">
            Crear cuenta — Liga <span className="text-primary">Extraordinaria</span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Creá tu liga en un solo paso
          </p>
        </div>

        <Card className="shadow-xl shadow-primary/5 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">Registrate</CardTitle>
            <CardDescription>
              Completá tus datos y creá tu liga
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="animate-in slide-in-from-top-1 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-sm">
                  <p className="flex items-center gap-2">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-destructive" />
                    {error}
                  </p>
                </div>
              )}

              {/* Admin fields */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Tus datos
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Carlos Gómez"
                    required
                    minLength={2}
                    maxLength={100}
                    disabled={loading}
                    autoComplete="name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@ejemplo.com"
                    required
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres"
                      required
                      minLength={8}
                      disabled={loading}
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Repetí la contraseña"
                      required
                      minLength={8}
                      disabled={loading}
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirm(!showConfirm)}
                      tabIndex={-1}
                      aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* League fields */}
              <div className="space-y-4">
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Tu liga
                  </h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leagueName">Nombre de la liga</Label>
                  <Input
                    id="leagueName"
                    name="leagueName"
                    type="text"
                    placeholder="Ej: Liga de Fútbol 2026"
                    required
                    minLength={2}
                    maxLength={100}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Se va a generar un slug único automáticamente.
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                className="h-10 w-full gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/20 transition-all hover:from-green-700 hover:to-emerald-700 hover:shadow-xl hover:shadow-green-500/30 active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creando cuenta...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Crear cuenta y liga
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 border-t pt-6">
            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tenés cuenta?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Iniciá sesión
              </Link>
            </p>
          </CardFooter>
        </Card>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
