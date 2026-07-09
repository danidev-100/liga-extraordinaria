"use server"

import { auth } from "@/lib/auth"
import db from "@/lib/db"

export async function getFixtureData(categoryId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")

  const category = await db.category.findUnique({
    where: { id: categoryId },
    include: { league: { select: { name: true, season: true } } },
  })
  if (!category) throw new Error("Categoría no encontrada")

  const matches = await db.match.findMany({
    where: { categoryId },
    include: {
      court: { select: { name: true } },
      localTeam: { select: { name: true, shortName: true } },
      visitorTeam: { select: { name: true, shortName: true } },
    },
    orderBy: [{ round: "asc" }, { date: "asc" }, { time: "asc" }],
  })

  const grouped = matches.reduce(
    (acc, m) => {
      const r = m.round
      if (!acc[r]) acc[r] = []
      acc[r].push(m)
      return acc
    },
    {} as Record<number, typeof matches>,
  )

  const rounds = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b)

  return {
    leagueName: category.league.name,
    season: category.league.season,
    categoryName: category.name,
    rounds: rounds.map((r) => ({
      round: r,
      matches: grouped[r].map((m) => ({
        local: m.localTeam.shortName,
        visitor: m.visitorTeam.shortName,
        date: m.date.toLocaleDateString("es-AR"),
        time: m.time,
        court: m.court.name,
        status: m.status === "FINISHED" && m.localScore != null
          ? `${m.localScore} – ${m.visitorScore}`
          : m.status === "PLAYING" ? "Jugando" : "",
      })),
    })),
    totalMatches: matches.length,
  }
}
