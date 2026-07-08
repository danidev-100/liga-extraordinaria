import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import db from "@/lib/db"
import { Sidebar } from "@/components/layout/sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  // Look up league slug from the user's leagueId for the sidebar
  let leagueSlug: string | undefined
  let leagueName: string | undefined

  if (session.user?.leagueId) {
    const league = await db.league.findUnique({
      where: { id: session.user.leagueId },
      select: { slug: true, name: true },
    })
    leagueSlug = league?.slug ?? undefined
    leagueName = league?.name ?? undefined
  }

  // SUPER_ADMIN can switch between all leagues
  const isSuperAdmin = session.user?.role === "SUPER_ADMIN"

  let allLeagues: { id: string; name: string; slug: string | null; season: string; isActive: boolean }[] = []
  if (isSuperAdmin) {
    allLeagues = await db.league.findMany({
      select: { id: true, name: true, slug: true, season: true, isActive: true },
      orderBy: { createdAt: "desc" },
    })
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        email={session.user?.email}
        leagueSlug={leagueSlug}
        leagueName={leagueName}
        isSuperAdmin={isSuperAdmin}
        allLeagues={allLeagues}
      />
      <main className="min-w-0 flex-1 overflow-x-auto px-6 pb-6 pt-14 md:p-8">
        {children}
      </main>
    </div>
  )
}
