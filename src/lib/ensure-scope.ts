import db from "./db"
import { auth } from "./auth"

export interface Scope {
  leagueId: string
  isSuperAdmin: boolean
}

export async function ensureScope(leagueSlug: string): Promise<Scope> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")

  const league = await db.league.findUnique({ where: { slug: leagueSlug } })
  if (!league) throw new Error("Liga no encontrada")

  const admin = await db.admin.findUnique({ where: { id: session.user.id } })
  if (!admin) throw new Error("Usuario no encontrado")

  const isSuperAdmin = admin.role === "SUPER_ADMIN"
  if (!isSuperAdmin && admin.leagueId !== league.id) {
    throw new Error("No tenés acceso a esta liga")
  }

  // Block regular admins from accessing inactive leagues
  if (!isSuperAdmin && !league.isActive) {
    throw new Error("Esta liga está desactivada. Contactá al administrador.")
  }

  return { leagueId: league.id, isSuperAdmin }
}
