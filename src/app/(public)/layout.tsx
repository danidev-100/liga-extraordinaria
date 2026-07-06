"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu, Trophy, X } from "lucide-react"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/matches", label: "Partidos" },
  { href: "/teams", label: "Equipos" },
  { href: "/standings", label: "Posiciones" },
  { href: "/goleadores", label: "Goleadores" },
  { href: "/tarjetas", label: "Tarjetas" },
]

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col">
      {/* Public header — glassmorphism nav */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 dark:bg-black/50 dark:supports-[backdrop-filter]:bg-black/50">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-105">
              <Trophy className="h-5 w-5" />
            </div>
            <span className="font-heading text-xl font-bold tracking-wide text-foreground">
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

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setMobileOpen(false)}
            />
            {/* Panel */}
            <div className="fixed right-0 top-0 flex h-full w-64 flex-col bg-background shadow-xl">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <span className="font-heading text-lg font-bold">Navegación</span>
                <button onClick={() => setMobileOpen(false)} aria-label="Cerrar menú">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex flex-col gap-1 p-4">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      {link.label}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        )}
      </header>

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
