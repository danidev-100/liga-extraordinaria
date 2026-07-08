"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
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
    { href: `${base}/courts`, label: "Canchas", icon: MapPin },
    { href: `${base}/leagues`, label: "Ligas", icon: Trophy },
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

  const userInitial = email?.charAt(0)?.toUpperCase() ?? "U"

  // For SUPER_ADMIN, detect the current league slug from the URL
  // so the sidebar nav items stay scoped when switching leagues
  const effectiveSlug = isSuperAdmin
    ? pathname.match(/^\/admin\/ligas\/([^/]+)/)?.[1] || leagueSlug
    : leagueSlug
  const navItems = getNavItems(effectiveSlug)

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-3 z-50 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r bg-sidebar transition-transform duration-200 md:static md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Sporty green header */}
        <div className="flex h-16 items-center gap-3 bg-sidebar-primary px-5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-white/20">
            <Trophy className="size-4 text-sidebar-primary-foreground" />
          </div>
          {isSuperAdmin && allLeagues ? (
            <div>
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
            <div>
              <h1 className="text-sm font-bold tracking-tight text-sidebar-primary-foreground">
                {leagueName ?? "Liga Deportiva"}
              </h1>
              <p className="text-[11px] leading-tight text-sidebar-primary-foreground/70">
                Panel de Administración
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
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
