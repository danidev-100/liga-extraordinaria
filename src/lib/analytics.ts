import db from "@/lib/db"
import { Prisma } from "@prisma/client"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GoalsDistribution {
  teamShortName: string
  teamColor: string | null
  goals: number
}

export interface MatchStatusRow {
  status: string
  count: number
}

export interface CardsBreakdown {
  teamShortName: string
  yellows: number
  reds: number
}

export interface FormTrendRow {
  round: number
  wins: number
  draws: number
  losses: number
}

export interface TopScorerRow {
  playerName: string
  teamShortName: string
  goals: number
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Total goals per team across FINISHED matches.
 * Own goals are excluded (is_own_goal = false).
 */
export async function getGoalsDistribution(): Promise<GoalsDistribution[]> {
  try {
    return await db.$queryRaw<GoalsDistribution[]>`
      SELECT t.short_name AS "teamShortName",
             t.color AS "teamColor",
             COUNT(g.id)::int AS goals
      FROM goals g
      JOIN matches m ON m.id = g.match_id AND m.status = 'FINISHED'
      JOIN teams t ON t.id = g.team_id
      WHERE g.is_own_goal = false
      GROUP BY t.id, t.short_name, t.color
      ORDER BY goals DESC
    `
  } catch {
    return []
  }
}

/**
 * Count of matches per status (SCHEDULED, PLAYING, FINISHED).
 */
export async function getMatchStatus(): Promise<MatchStatusRow[]> {
  try {
    const result = await db.match.groupBy({
      by: ["status"],
      _count: { id: true },
    })
    return result.map((r) => ({
      status: r.status,
      count: r._count.id,
    }))
  } catch {
    return []
  }
}

/**
 * Yellow and red card counts per team, across all matches.
 */
export async function getCardsBreakdown(): Promise<CardsBreakdown[]> {
  try {
    return await db.$queryRaw<CardsBreakdown[]>`
      SELECT t.short_name AS "teamShortName",
             COUNT(c.id) FILTER (WHERE c.type = 'YELLOW')::int AS yellows,
             COUNT(c.id) FILTER (WHERE c.type = 'RED')::int AS reds
      FROM cards c
      JOIN teams t ON t.id = c.team_id
      GROUP BY t.id, t.short_name
      ORDER BY t.short_name
    `
  } catch {
    return []
  }
}

/**
 * Wins / draws / losses per round for the last 10 finished rounds.
 * Optional categoryId filter scopes the result to a specific category.
 */
export async function getFormTrend(categoryId?: string): Promise<FormTrendRow[]> {
  try {
    const categoryFilter = categoryId
      ? Prisma.sql`AND m.category_id = ${categoryId}::uuid`
      : Prisma.empty

    return await db.$queryRaw<FormTrendRow[]>`
      WITH latest AS (
        SELECT MAX(round) AS max_round FROM matches WHERE status = 'FINISHED'
      )
      SELECT m.round,
             COUNT(*) FILTER (WHERE m.local_score > m.visitor_score)::int AS wins,
             COUNT(*) FILTER (WHERE m.local_score = m.visitor_score)::int AS draws,
             COUNT(*) FILTER (WHERE m.local_score < m.visitor_score)::int AS losses
      FROM matches m, latest l
      WHERE m.status = 'FINISHED'
        AND m.round >= l.max_round - 9
        ${categoryFilter}
      GROUP BY m.round
      ORDER BY m.round ASC
    `
  } catch {
    return []
  }
}

/**
 * Top N scorers (default 5) across all FINISHED matches.
 * Own goals are excluded.
 */
export async function getTopScorers(limit: number = 5): Promise<TopScorerRow[]> {
  try {
    return await db.$queryRaw<TopScorerRow[]>`
      SELECT CONCAT(p.name, ' ', p.surname) AS "playerName",
             t.short_name AS "teamShortName",
             COUNT(g.id)::int AS goals
      FROM goals g
      JOIN matches m ON m.id = g.match_id AND m.status = 'FINISHED'
      JOIN players p ON p.id = g.player_id
      JOIN teams t ON t.id = g.team_id
      WHERE g.is_own_goal = false
      GROUP BY p.id, p.name, p.surname, t.short_name
      ORDER BY goals DESC
      LIMIT ${limit}
    `
  } catch {
    return []
  }
}
