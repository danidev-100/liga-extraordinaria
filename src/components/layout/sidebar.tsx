"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Shield,
  Users,
  UserCircle,
  Calendar,
  MapPin,
  Trophy,
  ListOrdered,
  ShieldAlert,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { LeagueSwitcher } from "@/components/layout/league-switcher"

interface League {
  id: string
  name: string
  slug: string | null
  season: string
}

function getNavItems(leagueSlug?: string) {
  const base = leagueSlug ? `/admin/ligas/${leagueSlug}` : "/admin"
  return [
    { href: base, label: "Dashboard", icon: LayoutDashboard },
    { href: `${base}/categories`, label: "Categorías", icon: Shield },
    { href: `${base}/teams`, label: "Equipos", icon: Users },
    { href: `${base}/players`, label: "Jugadores", icon: UserCircle },
    { href: `${base}/matches`, label: "Partidos", icon: Calendar },
    { href: `${base}/courts`, label: "Lugares", icon: MapPin },
    { href: `${base}/leagues`, label: "Torneos", icon: Trophy },
    { href: `${base}/standings`, label: "Posiciones", icon: ListOrdered },
  ]
}

export function Sidebar({
  email,
  leagueSlug,
  leagueName,
  isSuperAdmin,
  allLeagues,
}: {
  email?: string | null
  leagueSlug?: string
  leagueName?: string | null
  isSuperAdmin?: boolean
  allLeagues?: League[]
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [drawerPathname, setDrawerPathname] = useState(pathname)

  // Close the drawer whenever the route changes (link click, back/forward, programmatic nav)
  if (drawerPathname !== pathname) {
    setDrawerPathname(pathname)
    setMobileOpen(false)
  }

  // Esc closes the drawer, and page scroll is locked while it is open
  useEffect(() => {
    if (!mobileOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false)
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [mobileOpen])

  // Above md the sidebar is static, so drop the drawer state (and release the scroll lock)
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)")

    function handleBreakpointChange() {
      if (desktop.matches) setMobileOpen(false)
    }

    desktop.addEventListener("change", handleBreakpointChange)
    return () => desktop.removeEventListener("change", handleBreakpointChange)
  }, [])

  const userInitial = email?.charAt(0)?.toUpperCase() ?? "U"

  // For SUPER_ADMIN, detect the current league slug from the URL
  // so the sidebar nav items stay scoped when switching leagues
  const effectiveSlug = isSuperAdmin
    ? pathname.match(/^\/admin\/ligas\/([^/]+)/)?.[1] || leagueSlug
    : leagueSlug
  const navItems = getNavItems(effectiveSlug)

  return (
    <>
      {/* Mobile menu button — 44×44 px target, kept inside the safe area */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-3 top-[calc(0.75rem+env(safe-area-inset-top))] z-50 size-11 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={mobileOpen}
        aria-controls="admin-mobile-drawer"
      >
        {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        id="admin-mobile-drawer"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[85vw] max-w-64 shrink-0 flex-col overflow-y-auto overscroll-contain border-r bg-sidebar pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] transition-transform duration-200 md:static md:w-64 md:translate-x-0 md:overflow-visible md:py-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Sporty green header — pl clears the fixed mobile toggle */}
        <div className="flex h-16 items-center gap-3 bg-sidebar-primary pl-16 pr-5 md:pl-5">
          <Link href="/" className="flex size-8 items-center justify-center rounded-lg bg-white/20 transition-opacity hover:opacity-80">
            <Trophy className="size-4 text-sidebar-primary-foreground" />
          </Link>
          {isSuperAdmin && allLeagues ? (
            <div className="min-w-0 flex-1">
              <LeagueSwitcher
                leagues={allLeagues}
                currentSlug={effectiveSlug}
                currentName={leagueName}
              />
              <p className="text-[11px] leading-tight text-sidebar-primary-foreground/70">
                Panel de Administración
              </p>
            </div>
          ) : (
            <Link href="/" className="min-w-0 transition-opacity hover:opacity-80">
              <h1 className="text-sm font-bold tracking-tight text-sidebar-primary-foreground truncate">
                {leagueName ?? "Torneo Deportivo"}
              </h1>
              <p className="text-[11px] leading-tight text-sidebar-primary-foreground/70">
                Panel de Administración
              </p>
            </Link>
          )}
        </div>

        {/* Navigation */}
        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain p-3">
          {navItems.map((item) => {
            const isActive =
              item.href === (leagueSlug ? `/admin/ligas/${leagueSlug}` : "/admin")
                ? pathname === item.href
                : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                )}
                <item.icon
                  className={cn(
                    "size-4 shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-accent-foreground",
                  )}
                />
                <span>{item.label}</span>
              </Link>
            )
          })}

          {/* Admin management — SUPER_ADMIN only */}
          {isSuperAdmin && (
            <>
              <div className="my-2 border-t border-sidebar-border" />
              <div className="px-1.5 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                Super Admin
              </div>
              {(() => {
                const isActive = pathname.startsWith("/admin/admins")
                return (
                  <Link
                    href="/admin/admins"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                    )}
                    <ShieldAlert
                      className={cn(
                        "size-4 shrink-0",
                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-accent-foreground",
                      )}
                    />
                    <span>Administradores</span>
                  </Link>
                )
              })()}
            </>
          )}
        </nav>

        {/* User & logout section */}
        <div className="border-t border-sidebar-border p-3">
          <div className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2">
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {email ?? "Usuario"}
              </p>
            </div>
            <ThemeToggle />
          </div>
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={() => setMobileOpen(false)}
          >
            <LogOut className="size-4" />
            Cerrar Sesión
          </Link>
        </div>
      </aside>
    </>
  )
}
