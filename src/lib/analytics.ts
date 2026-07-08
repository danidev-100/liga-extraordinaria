import db from "@/lib/db"
import { Prisma } from "@prisma/client"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GoalsDistribution {
  teamShortName: string
  teamColor: string | null
  teamLogoUrl: string | null
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
 * When leagueId is provided, results are scoped to that league.
 */
export async function getGoalsDistribution(leagueId?: string): Promise<GoalsDistribution[]> {
  try {
    return await db.$queryRaw<GoalsDistribution[]>`
      SELECT t.short_name AS "teamShortName",
             t.color AS "teamColor",
             t.logo_url AS "teamLogoUrl",
             COUNT(g.id)::int AS goals
      FROM goals g
      JOIN matches m ON m.id = g.match_id AND m.status = 'FINISHED'
      JOIN teams t ON t.id = g.team_id
      JOIN categories cat ON cat.id = t.category_id
      WHERE g.is_own_goal = false
        ${leagueId ? Prisma.sql`AND cat.league_id = ${leagueId}::uuid` : Prisma.empty}
      GROUP BY t.id, t.short_name, t.color
      ORDER BY goals DESC
    `
  } catch {
    return []
  }
}

/**
 * Teams with fewest goals conceded (best defense).
 * Uses match scores: sum of opponent's score in each finished match.
 * When leagueId is provided, results are scoped to that league.
 */
export async function getLeastConceded(leagueId?: string): Promise<GoalsDistribution[]> {
  try {
    return await db.$queryRaw<GoalsDistribution[]>`
      WITH conceded AS (
        SELECT m.local_team_id AS team_id, m.visitor_score::int AS goals
        FROM matches m WHERE m.status = 'FINISHED'
        UNION ALL
        SELECT m.visitor_team_id AS team_id, m.local_score::int AS goals
        FROM matches m WHERE m.status = 'FINISHED'
      )
      SELECT t.short_name AS "teamShortName",
             t.color AS "teamColor",
             t.logo_url AS "teamLogoUrl",
             SUM(c.goals)::int AS goals
      FROM conceded c
      JOIN teams t ON t.id = c.team_id
      JOIN categories cat ON cat.id = t.category_id
      ${leagueId ? Prisma.sql`WHERE cat.league_id = ${leagueId}::uuid` : Prisma.empty}
      GROUP BY t.id, t.short_name, t.color
      ORDER BY goals ASC
      LIMIT 10
    `
  } catch {
    return []
  }
}

/**
 * Yellow and red card counts per team, across all matches.
 * When leagueId is provided, results are scoped to that league.
 */
export async function getCardsBreakdown(leagueId?: string): Promise<CardsBreakdown[]> {
  try {
    return await db.$queryRaw<CardsBreakdown[]>`
      SELECT t.short_name AS "teamShortName",
             COUNT(c.id) FILTER (WHERE c.type = 'YELLOW')::int AS yellows,
             COUNT(c.id) FILTER (WHERE c.type = 'RED')::int AS reds
      FROM cards c
      JOIN teams t ON t.id = c.team_id
      JOIN categories cat ON cat.id = t.category_id
      ${leagueId ? Prisma.sql`WHERE cat.league_id = ${leagueId}::uuid` : Prisma.empty}
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
 * When leagueId is provided, results are further scoped to that league.
 */
export async function getFormTrend(categoryId?: string, leagueId?: string): Promise<FormTrendRow[]> {
  try {
    const categoryFilter = categoryId
      ? Prisma.sql`AND m.category_id = ${categoryId}::uuid`
      : Prisma.empty

    const leagueFilter = leagueId && !categoryId
      ? Prisma.sql`AND m.category_id IN (SELECT id FROM categories WHERE league_id = ${leagueId}::uuid)`
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
        ${leagueFilter}
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
 * When leagueId is provided, results are scoped to that league.
 */
export async function getTopScorers(limit: number = 5, leagueId?: string): Promise<TopScorerRow[]> {
  try {
    return await db.$queryRaw<TopScorerRow[]>`
      SELECT CONCAT(p.name, ' ', p.surname) AS "playerName",
             t.short_name AS "teamShortName",
             COUNT(g.id)::int AS goals
      FROM goals g
      JOIN matches m ON m.id = g.match_id AND m.status = 'FINISHED'
      JOIN players p ON p.id = g.player_id
      JOIN teams t ON t.id = g.team_id
      JOIN categories cat ON cat.id = t.category_id
      WHERE g.is_own_goal = false
        ${leagueId ? Prisma.sql`AND cat.league_id = ${leagueId}::uuid` : Prisma.empty}
      GROUP BY p.id, p.name, p.surname, t.short_name
      ORDER BY goals DESC
      LIMIT ${limit}
    `
  } catch {
    return []
  }
}
