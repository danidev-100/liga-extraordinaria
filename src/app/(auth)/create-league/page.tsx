import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import db from "@/lib/db"
import { CreateLeagueForm } from "./create-league-form"

export const metadata = {
  title: "Crear Torneo — Torneo Pro",
  description: "Creá tu propio torneo para empezar a gestionar equipos y partidos",
}

export default async function CreateLeaguePage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // If admin already has a league, redirect to admin
  if (session.user.leagueId) {
    const admin = await db.admin.findUnique({
      where: { id: session.user.id },
      include: { league: { select: { slug: true } } },
    })
    if (admin?.league?.slug) {
      redirect(`/admin/ligas/${admin.league.slug}`)
    }
    redirect("/admin")
  }

  return <CreateLeagueForm userName={session.user.name ?? undefined} />
}
