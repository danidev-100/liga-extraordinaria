/**
 * Encounter duplication guard for round-robin fixtures.
 *
 * There is no home/away in this league: an encounter is just the pair of teams
 * that play each other, regardless of who is "local" or "visitante". A pair of
 * teams must appear at most once per category.
 */

export interface EncounterMatch {
  id: string
  round: number
  localTeamId: string | null
  visitorTeamId: string | null
}

export interface EncounterCandidate {
  /** Match id to exclude (the one being edited). Omit for new matches. */
  id?: string
  localTeamId: string | null
  visitorTeamId: string | null
}

export interface DuplicateEncounter {
  round: number
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

/**
 * Returns the round of the first match that already contains the same
 * unordered pair of teams, or null when the encounter is unique.
 */
export function findDuplicateEncounter(
  matches: EncounterMatch[],
  current: EncounterCandidate,
): DuplicateEncounter | null {
  if (!current.localTeamId || !current.visitorTeamId) return null
  // Same-team candidates are invalid encounters, never a duplicate.
  if (current.localTeamId === current.visitorTeamId) return null

  const a = current.localTeamId
  const b = current.visitorTeamId

  for (const match of matches) {
    if (current.id && match.id === current.id) continue
    if (!match.localTeamId || !match.visitorTeamId) continue

    const hasA = match.localTeamId === a || match.visitorTeamId === a
    const hasB = match.localTeamId === b || match.visitorTeamId === b

    if (hasA && hasB) {
      return { round: match.round }
    }
  }

  return null
}

export interface DuplicateEncounterGroup {
  /** Team ids in sorted order (a < b). */
  a: string
  b: string
  matchIds: string[]
  rounds: number[]
}

/**
 * Lists every unordered pair of teams that appears in more than one match.
 * Used to surface pre-existing duplicate encounters in the fixture.
 */
export function findDuplicateEncounters(matches: EncounterMatch[]): DuplicateEncounterGroup[] {
  const groups = new Map<string, DuplicateEncounterGroup>()

  for (const match of matches) {
    if (!match.localTeamId || !match.visitorTeamId) continue
    if (match.localTeamId === match.visitorTeamId) continue

    const key = pairKey(match.localTeamId, match.visitorTeamId)
    const existing = groups.get(key)
    if (existing) {
      existing.matchIds.push(match.id)
      existing.rounds.push(match.round)
    } else {
      groups.set(key, {
        a: match.localTeamId < match.visitorTeamId ? match.localTeamId : match.visitorTeamId,
        b: match.localTeamId < match.visitorTeamId ? match.visitorTeamId : match.localTeamId,
        matchIds: [match.id],
        rounds: [match.round],
      })
    }
  }

  return Array.from(groups.values())
    .filter((g) => g.matchIds.length > 1)
    .sort((x, y) => x.rounds[0] - y.rounds[0] || x.a.localeCompare(y.a))
}