"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trophy, ArrowLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createLeague } from "@/actions/league"
import Link from "next/link"

interface Props {
  userName?: string
}

export function CreateLeagueForm({ userName }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const form = e.currentTarget
    const data = new FormData(form)
    const startDate = data.get("startDate") as string
    const endDate = data.get("endDate") as string

    if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
      setError("La fecha de fin debe ser posterior a la fecha de inicio")
      setLoading(false)
      return
    }

    try {
      const league = await createLeague({
        name: data.get("name") as string,
        season: data.get("season") as string,
        startDate,
        endDate,
        isActive: true,
      })

      router.push(`/admin/ligas/${league.slug}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el torneo")
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4 dark:from-green-950 dark:via-zinc-950 dark:to-emerald-950">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl dark:bg-primary/10" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/10" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
            <Trophy className="h-6 w-6 text-primary-foreground" />
          </div>
          <h2 className="font-heading text-xl font-bold tracking-wide">
            Crear <span className="text-primary">Torneo</span>
          </h2>
          {userName && (
            <p className="mt-1 text-sm text-muted-foreground">
              Bienvenido, {userName}
            </p>
          )}
        </div>

        <Card className="shadow-xl shadow-primary/5 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Nuevo Torneo
            </CardTitle>
            <CardDescription>
              Configurá los datos básicos de tu torneo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-sm">
                  <p className="flex items-center gap-2">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-destructive" />
                    {error}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Nombre del torneo</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Ej: Torneo de Fútbol 2026"
                  required
                  minLength={2}
                  maxLength={100}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="season">Temporada</Label>
                <Input
                  id="season"
                  name="season"
                  type="text"
                  placeholder="Ej: 2026"
                  required
                  minLength={2}
                  maxLength={20}
                  disabled={loading}
                  defaultValue={new Date().getFullYear().toString()}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Fecha de inicio</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Fecha de fin</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    required
                    disabled={loading}
                  />
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
                    Creando torneo...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Crear Torneo
                  </>
                )}
              </Button>
            </form>
          </CardContent>
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
