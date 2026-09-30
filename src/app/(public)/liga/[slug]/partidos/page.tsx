export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import type { Prisma } from "@prisma/client"
import db from "@/lib/db"
import { getLeagueBySlug } from "@/lib/get-league"
import { MatchScheduleView } from "@/components/public/match-schedule-view"
import { parseFechaParam } from "@/lib/schedule-params"

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ categoryId?: string; fecha?: string }>
}

type GoalWithRefs = Prisma.GoalGetPayload<{
  include: {
    player: { select: { name: true; surname: true } }
    team: { select: { id: true; name: true; shortName: true; color: true; logoUrl: true } }
  }
}>
type CardWithRefs = Prisma.CardGetPayload<{
  include: {
    player: { select: { name: true; surname: true } }
    team: { select: { id: true; name: true; shortName: true; color: true; logoUrl: true } }
  }
}>

async function MatchesContent({
  slug,
  categoryId,
  fecha,
}: {
  slug: string
  categoryId?: string
  fecha?: number
}) {
  const league = await getLeagueBySlug(slug)
  if (!league) notFound()

  const categories = await db.category.findMany({
    where: { leagueId: league.id, isActive: true },
    include: { league: { select: { name: true } } },
    orderBy: { name: "asc" },
  })

  const leagueCategoryIds = categories.map((c) => c.id)

  const categoryWhere: Record<string, unknown> = {}
  if (categoryId) {
    categoryWhere.categoryId = categoryId
  } else if (leagueCategoryIds.length > 0) {
    categoryWhere.categoryId = { in: leagueCategoryIds }
  }

  const where: Record<string, unknown> = { ...categoryWhere }
  if (fecha !== undefined) {
    where.round = fecha
  }

  // Traer TODA la temporada de una vez: las pills de fecha/categoría filtran en
  // el cliente, así los clics no vuelven al servidor.
  const matches = await db.match.findMany({
    where: categoryWhere,
    include: {
      category: { select: { name: true } },
      court: { select: { name: true, venue: { select: { name: true, address: true, city: true, googleMapsLink: true } } } },
      localTeam: { select: { id: true, name: true, shortName: true, color: true, logoUrl: true } },
      visitorTeam: { select: { id: true, name: true, shortName: true, color: true, logoUrl: true } },
    },
    orderBy: [{ round: "asc" }, { date: "asc" }, { time: "asc" }],
  })

  // Goles y tarjetas solo de partidos finalizados, en dos queries planas.
  const goalsByMatch = new Map<string, GoalWithRefs[]>()
  const cardsByMatch = new Map<string, CardWithRefs[]>()

  const finishedMatchIds = matches
    .filter((match) => match.status === "FINISHED")
    .map((match) => match.id)

  if (finishedMatchIds.length > 0) {
    const goals = await db.goal.findMany({
      where: { matchId: { in: finishedMatchIds } },
      include: {
        player: { select: { name: true, surname: true } },
        team: { select: { id: true, name: true, shortName: true, color: true, logoUrl: true } },
      },
      orderBy: { minute: "asc" },
    })
    for (const goal of goals) {
      const list = goalsByMatch.get(goal.matchId)
      if (list) list.push(goal)
      else goalsByMatch.set(goal.matchId, [goal])
    }

    const cards = await db.card.findMany({
      where: { matchId: { in: finishedMatchIds } },
      include: {
        player: { select: { name: true, surname: true } },
        team: { select: { id: true, name: true, shortName: true, color: true, logoUrl: true } },
      },
      orderBy: { minute: "asc" },
    })
    for (const card of cards) {
      const list = cardsByMatch.get(card.matchId)
      if (list) list.push(card)
      else cardsByMatch.set(card.matchId, [card])
    }
  }

  const teams = await db.team.findMany({
    where: { categoryId: { in: leagueCategoryIds } },
    select: { id: true, name: true, shortName: true, color: true, logoUrl: true, categoryId: true },
    orderBy: { name: "asc" },
  })

  const hiddenRounds = await db.roundVisibility.findMany({
    where: { categoryId: { in: leagueCategoryIds }, hidden: true },
    select: { categoryId: true, round: true },
  })
  const hiddenRoundKeys = hiddenRounds.map((h) => `${h.categoryId}:${h.round}`)

  const roundNotifications = await db.roundNotification.findMany({
    where: categoryWhere,
    select: { categoryId: true, round: true, message: true },
  })

  const roundRows = await db.match.findMany({
    where: categoryWhere,
    distinct: ["round", "categoryId"],
    select: { round: true, categoryId: true },
    orderBy: { round: "asc" },
  })

  const hiddenRoundKeySet = new Set(hiddenRoundKeys)
  const availableFechas = Array.from(
    new Set(
      roundRows
        .filter((row) => !hiddenRoundKeySet.has(`${row.categoryId}:${row.round}`))
        .map((row) => row.round),
    ),
  ).sort((a, b) => a - b)

  return (
    <div className="relative space-y-6">
      {/* Background image */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <img
          src="/partido.jpeg"
          alt=""
          className="h-full w-full object-cover object-center opacity-15"
        />
      </div>

      <MatchScheduleView
        slug={slug}
        leagueName={league.name}
        season={league.season}
        categories={categories}
        matches={matches}
        goalsByMatch={Object.fromEntries(goalsByMatch)}
        cardsByMatch={Object.fromEntries(cardsByMatch)}
        teams={teams}
        hiddenRoundKeys={hiddenRoundKeys}
        roundNotifications={roundNotifications}
        availableFechas={availableFechas}
        initialCategoryId={categoryId}
        initialFecha={fecha}
      />

      <style>{`
        @media print {
          a { color: inherit !important; text-decoration: none !important; }
          section { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  )
}

export default async function LeagueMatchesPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { categoryId, fecha: rawFecha } = await searchParams
  const fecha = parseFechaParam(rawFecha)

  return <MatchesContent slug={slug} categoryId={categoryId} fecha={fecha} />
}