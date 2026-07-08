"use server"

import bcrypt from "bcryptjs"
import db from "@/lib/db"
import { generateSlug } from "@/lib/slug"
import { auth } from "@/lib/auth"

export interface RegisterResult {
  error?: string
  slug?: string
  email?: string
  password?: string
}

export async function register(formData: FormData): Promise<RegisterResult> {
  const name = formData.get("name") as string
  const email = (formData.get("email") as string)?.toLowerCase().trim()
  const password = formData.get("password") as string
  const leagueName = formData.get("leagueName") as string

  // Validation
  if (!name || name.length < 2) return { error: "El nombre debe tener al menos 2 caracteres" }
  if (!email || !email.includes("@")) return { error: "Email inválido" }
  if (!password || password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres" }
  if (!leagueName || leagueName.length < 2) return { error: "El nombre de la liga debe tener al menos 2 caracteres" }

  try {
    // Check email uniqueness
    const existing = await db.admin.findUnique({ where: { email } })
    if (existing) return { error: "El email ya está registrado" }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create admin (without league)
    const admin = await db.admin.create({
      data: { name, email, passwordHash, role: "ADMIN" },
    })

    // Generate unique slug
    const slug = await generateSlug(leagueName)

    // Create league
    const league = await db.league.create({
      data: {
        name: leagueName,
        slug,
        season: new Date().getFullYear().toString(),
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        isActive: true,
      },
    })

    // Assign admin to league
    await db.admin.update({
      where: { id: admin.id },
      data: { leagueId: league.id },
    })

    return { slug: league.slug!, email, password }
  } catch (err) {
    console.error("Registration error:", err)
    return { error: "Ocurrió un error al registrarse. Intentalo de nuevo." }
  }
}

export async function getMyLeagueSlug(): Promise<string | null> {
  const session = await auth()
  if (!session?.user?.leagueId) return null

  const league = await db.league.findUnique({
    where: { id: session.user.leagueId },
    select: { slug: true },
  })
  return league?.slug ?? null
}
