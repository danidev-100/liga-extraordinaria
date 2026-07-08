"use server"

import bcrypt from "bcryptjs"
import crypto from "crypto"
import db from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { createAdminSchema, updateAdminSchema, type CreateAdminData, type UpdateAdminData } from "@/lib/validations/admin"

function generatePassword(): string {
  return crypto.randomBytes(4).toString("hex") // 8 chars
}

async function ensureSuperAdmin() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
    throw new Error("No autorizado. Solo SUPER_ADMIN puede gestionar usuarios.")
  }
  return session
}

export async function getAdmins() {
  await ensureSuperAdmin()

  return db.admin.findMany({
    include: {
      league: { select: { id: true, name: true, slug: true, season: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getAdminById(id: string) {
  await ensureSuperAdmin()

  return db.admin.findUnique({
    where: { id },
    include: {
      league: { select: { id: true, name: true, slug: true, season: true } },
    },
  })
}

export async function getLeaguesForAdmin() {
  await ensureSuperAdmin()

  return db.league.findMany({
    select: { id: true, name: true, season: true, isActive: true },
    orderBy: { name: "asc" },
  })
}

export async function createAdmin(data: CreateAdminData) {
  await ensureSuperAdmin()

  const parsed = createAdminSchema.parse(data)

  // Check email uniqueness
  const existing = await db.admin.findUnique({ where: { email: parsed.email } })
  if (existing) {
    throw new Error("El email ya está registrado")
  }

  // Verify league exists
  const league = await db.league.findUnique({ where: { id: parsed.leagueId } })
  if (!league) {
    throw new Error("La liga seleccionada no existe")
  }

  const password = generatePassword()
  const passwordHash = await bcrypt.hash(password, 10)

  await db.admin.create({
    data: {
      name: parsed.name,
      email: parsed.email,
      passwordHash,
      role: "ADMIN",
      leagueId: parsed.leagueId,
    },
  })

  revalidatePath("/admin/admins")
  return { email: parsed.email, password, leagueName: league.name }
}

export async function updateAdmin(id: string, data: UpdateAdminData) {
  await ensureSuperAdmin()

  const parsed = updateAdminSchema.parse(data)

  // If email changed, check uniqueness
  if (parsed.email) {
    const existing = await db.admin.findUnique({ where: { email: parsed.email } })
    if (existing && existing.id !== id) {
      throw new Error("El email ya está registrado por otro usuario")
    }
  }

  const updateData: Record<string, unknown> = {}
  if (parsed.name !== undefined) updateData.name = parsed.name
  if (parsed.email !== undefined) updateData.email = parsed.email
  if (parsed.leagueId !== undefined) updateData.leagueId = parsed.leagueId

  await db.admin.update({
    where: { id },
    data: updateData,
  })

  revalidatePath("/admin/admins")
}

export async function resetAdminPassword(id: string) {
  await ensureSuperAdmin()

  const admin = await db.admin.findUnique({ where: { id } })
  if (!admin) throw new Error("Usuario no encontrado")

  const password = generatePassword()
  const passwordHash = await bcrypt.hash(password, 10)

  await db.admin.update({
    where: { id },
    data: { passwordHash },
  })

  return { email: admin.email, password }
}

export async function deleteAdmin(id: string) {
  await ensureSuperAdmin()

  const session = await auth()
  if (id === session?.user?.id) {
    throw new Error("No podés eliminarte a vos mismo")
  }

  await db.admin.delete({ where: { id } })
  revalidatePath("/admin/admins")
}
