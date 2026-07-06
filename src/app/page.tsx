import Link from "next/link"
import { Trophy, Shield, Calendar, Goal, Users, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import db from "@/lib/db"

async function getStats() {
  try {
    const [teamCount, playerCount, matchCount] = await Promise.all([
      db.team.count(),
      db.player.count(),
      db.match.count(),
    ])
    return { teamCount, playerCount, matchCount }
  } catch {
    return { teamCount: 0, playerCount: 0, matchCount: 0 }
  }
}

export default async function Home() {
  const { teamCount, playerCount, matchCount } = await getStats()

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-105">
              <Trophy className="h-5 w-5" />
            </div>
            <span className="font-heading text-xl font-bold tracking-wide">
              Liga <span className="text-primary">Extraordinaria</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/matches">
              <Button variant="ghost" size="sm">
                Partidos
              </Button>
            </Link>
            <Link href="/standings">
              <Button variant="ghost" size="sm">
                Posiciones
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                Admin
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="relative overflow-hidden">
          {/* Background decorations */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            {/* Gradient orbs */}
            <div className="absolute -right-60 -top-60 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -bottom-60 -left-60 h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.04] blur-3xl" />

            {/* Subtle grid pattern */}
            <svg
              className="absolute inset-0 h-full w-full opacity-[0.03] dark:opacity-[0.06]"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
                  <path d="M 48 0 L 0 0 0 48" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          <div className="container relative mx-auto px-4 py-20 md:py-32 lg:py-40">
            <div className="mx-auto max-w-4xl text-center">
              {/* Badge */}
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
                <Trophy className="h-4 w-4" />
                Gestión de ligas deportivas
              </div>

              {/* Main title */}
              <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Administrá tu liga con{" "}
                <span className="bg-gradient-to-r from-green-600 via-emerald-500 to-green-500 bg-clip-text text-transparent dark:from-green-400 dark:via-emerald-400 dark:to-green-300">
                  potencia
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
                Gestioná equipos, jugadores, partidos y posiciones al instante.
                La plataforma todo-en-uno para tu liga de fútbol con fixture automático
                y estadísticas en tiempo real.
              </p>

              {/* CTA Buttons */}
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/matches">
                  <Button
                    size="lg"
                    className="gap-2 px-8 text-base shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]"
                  >
                    <Calendar className="h-5 w-5" />
                    Ver Partidos
                  </Button>
                </Link>
                <Link href="/standings">
                  <Button variant="secondary" size="lg" className="gap-2 px-8 text-base">
                    <Trophy className="h-5 w-5" />
                    Ver Posiciones
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="gap-2 px-8 text-base">
                    <Shield className="h-5 w-5" />
                    Admin
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y bg-muted/30">
          <div className="container mx-auto px-4 py-16">
            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Shield className="h-7 w-7 text-primary" />
                </div>
                <span className="font-heading text-4xl font-bold tracking-tight">
                  {teamCount}
                </span>
                <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  Equipos
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <span className="font-heading text-4xl font-bold tracking-tight">
                  {playerCount}
                </span>
                <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  Jugadores
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Goal className="h-7 w-7 text-primary" />
                </div>
                <span className="font-heading text-4xl font-bold tracking-tight">
                  {matchCount}
                </span>
                <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  Partidos
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                Todo lo que necesitás
              </h2>
              <p className="mt-4 text-muted-foreground">
                Una plataforma completa para gestionar tu liga de principio a fin
              </p>
            </div>

            <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
              {/* Feature 1 */}
              <div className="group relative rounded-xl border bg-card p-8 transition-all hover:shadow-lg hover:shadow-primary/5">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-xl font-semibold">Gestión de Equipos</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Administrá planteles, categorías y datos de cada jugador con
                  fotos, números y estadísticas individuales.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="group relative rounded-xl border bg-card p-8 transition-all hover:shadow-lg hover:shadow-primary/5">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-xl font-semibold">Fixture Automático</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Generación inteligente de fixture con programación de fechas,
                  asignación de canchas y registro de resultados.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="group relative rounded-xl border bg-card p-8 transition-all hover:shadow-lg hover:shadow-primary/5">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Trophy className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-xl font-semibold">Tabla de Posiciones</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Tabla actualizada automáticamente con cada resultado. Puntos,
                  goles, tarjetas, todo sincronizado en tiempo real.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Trophy className="h-4 w-4" />
              </div>
              <span className="font-heading text-lg font-bold">Liga Extraordinaria</span>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Liga Extraordinaria. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
