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

const navLinks = [
  { href: "/matches", label: "Partidos", icon: Calendar },
  { href: "/teams", label: "Equipos", icon: Users },
  { href: "/standings", label: "Posiciones", icon: ListOrdered },
  { href: "/goleadores", label: "Goleadores", icon: Goal },
  { href: "/tarjetas", label: "Tarjetas", icon: ShieldAlert },
]

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

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
                const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
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
                const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
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
