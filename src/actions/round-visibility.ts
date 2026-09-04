"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import db from "@/lib/db"

export async function getRoundVisibility(categoryId: string): Promise<Record<number, boolean>> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")

  const rows = await db.roundVisibility.findMany({
    where: { categoryId, hidden: true },
    select: { round: true },
  })

  return rows.reduce(
    (acc, row) => {
      acc[row.round] = true
      return acc
    },
    {} as Record<number, boolean>,
  )
}

export async function setRoundVisibility(categoryId: string, round: number, hidden: boolean) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")

  await db.roundVisibility.upsert({
    where: { categoryId_round: { categoryId, round } },
    update: { hidden },
    create: { categoryId, round, hidden },
  })

  revalidatePath("/admin/matches")
  revalidatePath("/admin/matches/reorder")
}