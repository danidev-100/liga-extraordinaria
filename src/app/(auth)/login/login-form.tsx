"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn, useSession } from "next-auth/react"
import { CircleDot, Eye, EyeOff, LogIn, Trophy, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/admin")
    }
  }, [status, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Credenciales inválidas")
        setLoading(false)
        return
      }

      router.push("/admin")
      router.refresh()
    } catch {
      setError("Ocurrió un error al iniciar sesión")
      setLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-green-950 dark:via-zinc-950 dark:to-emerald-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4 dark:from-green-950 dark:via-zinc-950 dark:to-emerald-950">
      {/* Background decorations — matching landing page style */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl dark:bg-primary/10" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/10" />
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.02] dark:opacity-[0.04]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid-sm" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-sm)" />
        </svg>
      </div>

      <div className="relative w-full max-w-sm">
        {/* Branding */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
            <Trophy className="h-6 w-6 text-primary-foreground" />
          </div>
          <h2 className="font-heading text-xl font-bold tracking-wide">
            Liga <span className="text-primary">Extraordinaria</span>
          </h2>
        </div>

        {/* Decorative badge */}
        <div className="mb-6 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary shadow-sm">
            <Shield className="h-3.5 w-3.5" />
            Panel de Administración
          </div>
        </div>

        <Card className="shadow-xl shadow-primary/5 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/20">
              <CircleDot className="h-7 w-7 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Iniciar Sesión
            </CardTitle>
            <CardDescription>
              Ingresá tus credenciales para acceder al panel de gestión
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
              {searchParams?.get("error") && (
                <div className="animate-in slide-in-from-top-1 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-sm">
                  <p className="flex items-center gap-2">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-destructive" />
                    Sesión requerida. Iniciá sesión para continuar.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@liga.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-10 transition-shadow focus-visible:shadow-[0_0_0_2px_rgba(22,163,74,0.2)]"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="h-10 pr-10 transition-shadow focus-visible:shadow-[0_0_0_2px_rgba(22,163,74,0.2)]"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
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
                    Ingresando...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Ingresar
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-6">
            <p className="text-center text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Liga Extraordinaria &mdash; Gestión de ligas deportivas
            </p>
          </CardFooter>
        </Card>

        {/* Back link */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            &larr; Volver al inicio
          </a>
        </div>
      </div>
    </div>
  )
}
