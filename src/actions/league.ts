"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { ensureScope } from "@/lib/ensure-scope"
import db from "@/lib/db"
import { leagueSchema, type LeagueFormData } from "@/lib/validations/league"

async function ensureAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("No autorizado")
  }
  return session
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export async function getLeagues(leagueId?: string) {
  await ensureAuth()

  return db.league.findMany({
    where: leagueId ? { id: leagueId } : undefined,
    orderBy: { createdAt: "desc" },
  })
}

export async function getLeagueById(id: string) {
  await ensureAuth()

  return db.league.findUnique({
    where: { id },
  })
}

export async function getLeagueBySlug(slug: string) {
  await ensureAuth()

  return db.league.findUnique({
    where: { slug },
  })
}

export async function createLeague(data: LeagueFormData) {
  const session = await ensureAuth()
  if (!session?.user?.id) throw new Error("No autorizado")

  const isSuperAdmin = session.user.role === "SUPER_ADMIN"

  // Check if admin already has a league (SUPER_ADMIN can create multiple)
  if (!isSuperAdmin && session.user.leagueId) {
    throw new Error("Ya tenés una liga creada")
  }

  const parsed = leagueSchema.parse(data)

  let slug = generateSlug(parsed.name)

  // Handle slug collision
  let counter = 1
  while (await db.league.findUnique({ where: { slug } })) {
    slug = `${generateSlug(parsed.name)}-${counter++}`
  }

  const league = await db.league.create({
    data: {
      name: parsed.name,
      season: parsed.season,
      slug,
      startDate: new Date(parsed.startDate),
      endDate: new Date(parsed.endDate),
      isActive: parsed.isActive ?? true,
    },
  })

  // Assign creator to the league
  let adminId = session.user.id
  const adminExists = await db.admin.findUnique({ where: { id: adminId } })
  if (!adminExists) {
    // Fallback to email (handles stale sessions after reseed)
    const adminByEmail = session.user.email
      ? await db.admin.findUnique({ where: { email: session.user.email } })
      : null
    if (adminByEmail) {
      adminId = adminByEmail.id
    } else {
      throw new Error("Usuario no encontrado. Cerra sesión y volvé a iniciar.")
    }
  }
  await db.admin.update({
    where: { id: adminId },
    data: { leagueId: league.id },
  })

  revalidatePath("/admin/leagues")
  return league
}

export async function updateLeague(id: string, data: Partial<LeagueFormData>, slug?: string) {
  await ensureAuth()
  if (slug) await ensureScope(slug)

  const parsed = leagueSchema.partial().parse(data)

  const updateData: Record<string, unknown> = {}
  if (parsed.name !== undefined) updateData.name = parsed.name
  if (parsed.season !== undefined) updateData.season = parsed.season
  if (parsed.startDate !== undefined) updateData.startDate = new Date(parsed.startDate)
  if (parsed.endDate !== undefined) updateData.endDate = new Date(parsed.endDate)
  if (parsed.isActive !== undefined) updateData.isActive = parsed.isActive

  const league = await db.league.update({
    where: { id },
    data: updateData,
  })

  revalidatePath("/admin/leagues")
  return league
}

export async function deleteLeague(id: string, slug?: string) {
  await ensureAuth()
  if (slug) await ensureScope(slug)

  await db.league.delete({
    where: { id },
  })

  revalidatePath("/admin/leagues")
}

export async function toggleLeagueActive(id: string, slug?: string) {
  await ensureAuth()
  if (slug) await ensureScope(slug)

  const league = await db.league.findUnique({ where: { id } })
  if (!league) throw new Error("Liga no encontrada")

  // Per-tenant toggle: do NOT deactivate other leagues
  const updated = await db.league.update({
    where: { id },
    data: { isActive: !league.isActive },
  })

  revalidatePath("/admin/leagues")
  return updated
}
