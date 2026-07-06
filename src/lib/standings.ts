export interface TeamInfo {
  id: string
  name: string
  shortName: string
}

export interface MatchResultData {
  localTeamId: string
  visitorTeamId: string
  localScore: number
  visitorScore: number
}

export interface CardData {
  teamId: string
  type: "YELLOW" | "RED"
}

export interface StandingRow {
  teamId: string
  teamName: string
  shortName: string
  pts: number
  pj: number
  pg: number
  pe: number
  pp: number
  gf: number
  gc: number
  dg: number
  ta: number
  tr: number
  position: number
}

/**
 * Pure function that calculates standings from match results and cards.
 * No side effects, no DB calls.
 *
 * Scoring: win = 3pts, draw = 1pt, loss = 0pts
 * Tiebreakers: points → goal difference → goals for → alphabetical
 */
export function calculateStandings(
  teams: TeamInfo[],
  matches: MatchResultData[],
  cards: CardData[],
): StandingRow[] {
  const map = new Map<string, StandingRow>()

  for (const team of teams) {
    map.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      shortName: team.shortName,
      pts: 0,
      pj: 0,
      pg: 0,
      pe: 0,
      pp: 0,
      gf: 0,
      gc: 0,
      dg: 0,
      ta: 0,
      tr: 0,
      position: 0,
    })
  }

  // Process matches
  for (const m of matches) {
    const local = map.get(m.localTeamId)
    const visitor = map.get(m.visitorTeamId)
    if (!local || !visitor) continue

    local.pj++
    visitor.pj++
    local.gf += m.localScore
    local.gc += m.visitorScore
    visitor.gf += m.visitorScore
    visitor.gc += m.localScore

    if (m.localScore > m.visitorScore) {
      local.pg++
      local.pts += 3
      visitor.pp++
    } else if (m.localScore < m.visitorScore) {
      visitor.pg++
      visitor.pts += 3
      local.pp++
    } else {
      local.pe++
      local.pts += 1
      visitor.pe++
      visitor.pts += 1
    }
  }

  // Process cards
  for (const card of cards) {
    const team = map.get(card.teamId)
    if (!team) continue
    if (card.type === "YELLOW") team.ta++
    else team.tr++
  }

  // Calculate goal difference
  for (const row of map.values()) {
    row.dg = row.gf - row.gc
  }

  // Sort: pts desc → dg desc → gf desc → alphabetical
  const sorted = Array.from(map.values()).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts
    if (b.dg !== a.dg) return b.dg - a.dg
    if (b.gf !== a.gf) return b.gf - a.gf
    return a.teamName.localeCompare(b.teamName, "es")
  })

  // Assign positions
  sorted.forEach((row, i) => {
    row.position = i + 1
  })

  return sorted
}
