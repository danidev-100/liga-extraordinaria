import { NextResponse } from "next/server"
import db from "@/lib/db"

export const dynamic = "force-dynamic"

/**
 * TEMPORARY inspection route (to be removed after fixture fix).
 * Lists leagues, categories, teams and matches grouped by round.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get("token") !== "insp3ct-tmp-9f2c") {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }
  try {
    const leagues = await db.league.findMany({ select: { id: true, name: true, slug: true, season: true } })
    const out: Record<string, unknown>[] = []

    for (const league of leagues) {
      const cats = await db.category.findMany({
        where: { leagueId: league.id },
        select: { id: true, name: true },
      })
      for (const cat of cats) {
        const teams = await db.team.findMany({
          where: { categoryId: cat.id },
          select: { id: true, name: true, shortName: true },
          orderBy: { name: "asc" },
        })
        const matches = await db.match.findMany({
          where: { categoryId: cat.id },
          select: {
            id: true, round: true,
            localTeam: { select: { name: true } },
            visitorTeam: { select: { name: true } },
            status: true,
          },
          orderBy: [{ round: "asc" }],
        })
        const byRound: Record<number, { id: string; local: string; visitor: string; status: string }[]> = {}
        for (const m of matches) {
          ;(byRound[m.round] ??= []).push({
            id: m.id,
            local: m.localTeam.name,
            visitor: m.visitorTeam.name,
            status: m.status,
          })
        }
        out.push({
          league: league.name,
          leagueSlug: league.slug,
          category: cat.name,
          categoryId: cat.id,
          teams: teams.map((t) => ({ id: t.id, name: t.name, short: t.shortName })),
          rounds: Object.entries(byRound)
            .map(([r, list]) => ({ round: Number(r), matches: list }))
            .sort((a, b) => a.round - b.round),
        })
      }
    }

    return NextResponse.json({ ok: true, categories: out })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}