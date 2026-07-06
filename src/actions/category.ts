"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import db from "@/lib/db"
import { categorySchema, type CategoryFormData } from "@/lib/validations/category"

async function ensureAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("No autorizado")
  }
  return session
}

export async function getCategories() {
  await ensureAuth()

  return db.category.findMany({
    include: { league: { select: { name: true } } },
    orderBy: { name: "asc" },
  })
}

export async function getCategoryById(id: string) {
  await ensureAuth()

  return db.category.findUnique({
    where: { id },
    include: { league: { select: { name: true } } },
  })
}

export async function createCategory(data: CategoryFormData) {
  await ensureAuth()

  const parsed = categorySchema.parse(data)

  if (parsed.maxAge < parsed.minAge) {
    throw new Error("La edad máxima no puede ser menor que la edad mínima")
  }

  const category = await db.category.create({
    data: {
      name: parsed.name,
      minAge: parsed.minAge,
      maxAge: parsed.maxAge,
      leagueId: parsed.leagueId,
    },
  })

  revalidatePath("/admin/categories")
  return category
}

export async function updateCategory(id: string, data: Partial<CategoryFormData>) {
  await ensureAuth()

  const parsed = categorySchema.partial().parse(data)

  if (parsed.minAge !== undefined && parsed.maxAge !== undefined && parsed.maxAge < parsed.minAge) {
    throw new Error("La edad máxima no puede ser menor que la edad mínima")
  }

  const category = await db.category.update({
    where: { id },
    data: parsed,
  })

  revalidatePath("/admin/categories")
  return category
}

export async function deleteCategory(id: string) {
  await ensureAuth()

  await db.category.delete({
    where: { id },
  })

  revalidatePath("/admin/categories")
}
