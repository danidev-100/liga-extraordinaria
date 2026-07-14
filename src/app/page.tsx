import Link from "next/link"
import { Trophy, Shield, Calendar, Goal, Users, ArrowRight, Plus } from "lucide-react"

export const dynamic = "force-dynamic"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FadeInView } from "@/components/public/fade-in-view"
import db from "@/lib/db"
import { auth } from "@/lib/auth"

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
  // Always show the landing page. No automatic redirects — the login flow
  // already handles post-auth navigation, and redirecting on the home page
  // prevents users from returning to the public root.
  const { teamCount, playerCount, matchCount } = await getStats()
  const leagues = await db.league.findMany({
    where: { isActive: true, slug: { not: null } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, season: true },
  })

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


        </div>
      </header>

      {/* Hero + Stats */}
      <main className="flex-1">
        <div className="relative">
          {/* Background — imagen + orbs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <img
              src="/cancha.png"
              alt=""
              className="h-full w-full object-cover object-center opacity-[0.27]"
            />
            {/* Gradient orbs */}
            <div className="absolute inset-0">
              <div className="absolute -right-60 -top-60 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute -bottom-60 -left-60 h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-3xl" />
              <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.04] blur-3xl" />
            </div>

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

          <section>
            <div className="container mx-auto px-4 py-12 md:py-32 lg:py-40">
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

              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="bg-muted/10 border-t border-white/10">
            <div className="container mx-auto px-4 py-16">
              <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
                <div className="flex flex-col items-center gap-2 rounded-xl p-6 text-center shadow-2xl shadow-black/10 ring-1 ring-white/20 transition-transform duration-200 hover:scale-[1.03]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                    <Shield className="h-7 w-7 text-white" />
                  </div>
                  <span className="font-heading text-4xl font-bold tracking-tight text-white drop-shadow-sm">
                    {teamCount}
                  </span>
                  <span className="text-sm font-medium uppercase tracking-wider text-white/60">
                    Equipos
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2 rounded-xl p-6 text-center shadow-2xl shadow-black/10 ring-1 ring-white/20 transition-transform duration-200 hover:scale-[1.03]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                  <span className="font-heading text-4xl font-bold tracking-tight text-white drop-shadow-sm">
                    {playerCount}
                  </span>
                  <span className="text-sm font-medium uppercase tracking-wider text-white/60">
                    Jugadores
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2 rounded-xl p-6 text-center shadow-2xl shadow-black/10 ring-1 ring-white/20 transition-transform duration-200 hover:scale-[1.03]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                    <Goal className="h-7 w-7 text-white" />
                  </div>
                  <span className="font-heading text-4xl font-bold tracking-tight text-white drop-shadow-sm">
                    {matchCount}
                  </span>
                  <span className="text-sm font-medium uppercase tracking-wider text-white/60">
                    Partidos
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Gradient transition */}
        <div className="h-16 bg-gradient-to-b from-muted/10 to-background" />

        {/* Features */}
        <FadeInView>
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
              <div className="group relative rounded-xl border bg-card/70 backdrop-blur-xl p-8 shadow-xl transition-all duration-200 hover:scale-[1.03] hover:shadow-2xl hover:shadow-primary/10">
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
              <div className="group relative rounded-xl border bg-card/70 backdrop-blur-xl p-8 shadow-xl transition-all duration-200 hover:scale-[1.03] hover:shadow-2xl hover:shadow-primary/10">
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
              <div className="group relative rounded-xl border bg-card/70 backdrop-blur-xl p-8 shadow-xl transition-all duration-200 hover:scale-[1.03] hover:shadow-2xl hover:shadow-primary/10">
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
      </FadeInView>

        {/* League directory — shown when at least one league exists */}
        {leagues.length > 0 && (
          <section id="ligas" className="border-t bg-muted/30 py-20 scroll-mt-24">
            <div className="container mx-auto px-4">
              <div className="mx-auto mb-12 max-w-2xl text-center">
                <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                  Ligas activas
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Explorá las ligas disponibles y seguí los resultados
                </p>
              </div>

              <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {leagues.map((l) => (
                  <Link key={l.id} href={`/liga/${l.slug}/posiciones`} className="group">
                    <Card className="h-full bg-card/70 backdrop-blur-xl shadow-xl transition-all duration-300 hover:-rotate-1 hover:scale-[1.05] hover:shadow-2xl hover:ring-2 hover:ring-primary/30">
                      <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                          <Trophy className="h-7 w-7" />
                        </div>
                        <div>
                          <h3 className="font-heading text-lg font-semibold">{l.name}</h3>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            Temporada {l.season}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                          Ver liga <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA — Create your league */}
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="mx-auto max-w-2xl">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/20">
                <Plus className="h-8 w-8 text-white" />
              </div>
              <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                ¿Tenés tu propia liga?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
                Creá tu liga en segundos, gestioná equipos, partidos y estadísticas
                desde un solo lugar.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/login">
                  <Button variant="outline" size="lg" className="gap-2 px-8 text-base">
                    <Shield className="h-5 w-5" />
                    Ya tengo cuenta
                  </Button>
                </Link>
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
            <a
              href="https://wa.me/542616095070"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-green-600"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-green-500">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Para información por WhatsApp
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
