"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  Menu,
  Trophy,
  X,
  Calendar,
  Users,
  ListOrdered,
  Goal,
  ShieldAlert,
} from "lucide-react"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { cn } from "@/lib/utils"

const navLinkDefs = [
  { scopedPath: "", oldPath: "/", label: "Inicio", icon: Trophy },
  { scopedPath: "partidos", oldPath: "/matches", label: "Partidos", icon: Calendar },
  { scopedPath: "equipos", oldPath: "/teams", label: "Equipos", icon: Users },
  { scopedPath: "posiciones", oldPath: "/standings", label: "Posiciones", icon: ListOrdered },
  { scopedPath: "goleadores", oldPath: "/goleadores", label: "Goleadores", icon: Goal },
  { scopedPath: "tarjetas", oldPath: "/tarjetas", label: "Tarjetas", icon: ShieldAlert },
]

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Extract league slug from pathname: /liga/[slug]/...
  const leagueMatch = pathname.match(/^\/liga\/([^/]+)/)
  const leagueSlug = leagueMatch?.[1] ?? null

  // Build nav links: scoped when on a league page, old paths otherwise
  const navLinks = navLinkDefs.map((link) => ({
    ...link,
    href: leagueSlug ? `/liga/${leagueSlug}/${link.scopedPath}` : link.oldPath,
  }))

  return (
    <div className="flex min-h-screen flex-col">
      {/* Public header — glassmorphism nav */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 dark:bg-black/50 dark:supports-[backdrop-filter]:bg-black/50">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5 group min-w-0 shrink">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-105">
              <Trophy className="h-5 w-5" />
            </div>
            <span className="font-heading text-lg sm:text-xl font-bold tracking-wide text-foreground truncate">
              Liga <span className="text-primary">Extraordinaria</span>
            </span>
          </Link>

          <div className="flex items-center gap-1">
            {/* Desktop nav — hidden below md */}
            <nav className="mr-2 hidden items-center gap-1 md:flex">
              {navLinks.map((link) => {
                const isHome = link.scopedPath === ""
                const isActive = isHome
                  ? pathname === link.href
                  : pathname === link.href || pathname.startsWith(link.href + "/")
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "relative px-3 py-1.5 text-sm font-medium transition-colors",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute -bottom-[3px] inset-x-2 h-0.5 rounded-full bg-primary" />
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Mobile hamburger — visible below md */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="mr-2 flex md:hidden"
              aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Mobile drawer — fuera del header para que fixed funcione bien */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          {/* Panel — slides from left like admin */}
          <div className="fixed left-0 top-0 flex h-full w-64 flex-col bg-background shadow-xl">
            {/* Branded header */}
            <div className="flex h-16 items-center gap-3 bg-primary px-5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-white/20">
                <Trophy className="size-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-primary-foreground">
                  Liga Extraordinaria
                </h1>
                <p className="text-[11px] leading-tight text-primary-foreground/70">
                  Navegación
                </p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
              {navLinks.map((link) => {
                const Icon = link.icon
                const isHome = link.scopedPath === ""
                const isActive = isHome
                  ? pathname === link.href
                  : pathname === link.href || pathname.startsWith(link.href + "/")
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                    )}
                    <Icon
                      className={cn(
                        "size-4 shrink-0",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-accent-foreground",
                      )}
                    />
                    <span>{link.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Theme toggle */}
            <div className="border-t p-3">
              <div className="flex items-center justify-between rounded-lg px-3 py-2">
                <span className="text-sm text-muted-foreground">Apariencia</span>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">{children}</div>
      </main>

      {/* Floating WhatsApp button */}
      <a
        href="https://wa.me/542616095070"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-all hover:bg-green-600 hover:shadow-xl hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6 sm:h-14 sm:w-14"
        aria-label="Contactar por WhatsApp"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 sm:h-7 sm:w-7">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p className="font-medium">
            &copy; {new Date().getFullYear()} Liga Extraordinaria. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
