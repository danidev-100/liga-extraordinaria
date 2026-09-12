"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import db from "@/lib/db"

export async function getRoundNotification(categoryId: string): Promise<Record<number, string>> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")

  const rows = await db.roundNotification.findMany({
    where: { categoryId },
    select: { round: true, message: true },
  })

  return rows.reduce(
    (acc, row) => {
      acc[row.round] = row.message
      return acc
    },
    {} as Record<number, string>,
  )
}

export async function setRoundNotification(
  categoryId: string,
  round: number,
  message: string,
  leagueSlug?: string,
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")

  const trimmed = message.trim()
  if (!trimmed) {
    await db.roundNotification.deleteMany({
      where: { categoryId, round },
    })
  } else {
    await db.roundNotification.upsert({
      where: { categoryId_round: { categoryId, round } },
      update: { message: trimmed },
      create: { categoryId, round, message: trimmed },
    })
  }

  revalidatePath("/admin/matches")
  if (leagueSlug) revalidatePath(`/admin/ligas/${leagueSlug}/matches`)
}

export async function deleteRoundNotification(
  categoryId: string,
  round: number,
  leagueSlug?: string,
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")

  await db.roundNotification.deleteMany({
    where: { categoryId, round },
  })

  revalidatePath("/admin/matches")
  if (leagueSlug) revalidatePath(`/admin/ligas/${leagueSlug}/matches`)
}