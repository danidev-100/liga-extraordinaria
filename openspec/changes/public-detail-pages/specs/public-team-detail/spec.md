# Public Team Detail Specification

## Purpose

Provide public read-only access to team profile pages — roster, match results, team statistics, and top scorers. Extend the standings table to link team names to their detail pages. Add a "Equipos" entry in the public navigation.

## Requirements

### Requirement: Team page routing

The system MUST expose a route at `/teams/[id]` that renders a public team profile. When no team matches the given `id`, the system MUST call `notFound()` to return a 404.

#### Scenario: Existing team renders detail page

- GIVEN a team with id "abc-123" exists
- WHEN navigating to `/teams/abc-123`
- THEN the page renders with the team's name, roster, matches, stats, and top scorers

#### Scenario: Non-existent team returns 404

- GIVEN no team exists with the id "nonexistent"
- WHEN navigating to `/teams/nonexistent`
- THEN the system renders a 404 page

### Requirement: Roster display

The system MUST display the team's active players sorted by jersey number ascending, then by surname alphabetically. Each entry SHALL show jersey number, name, and surname.

#### Scenario: Team with active players

- GIVEN a team has 5 active players and 2 inactive players
- WHEN the team detail page renders
- THEN only the 5 active players are shown, sorted by jersey number

#### Scenario: Team with no active players

- GIVEN a team has 0 active players
- WHEN the team detail page renders
- THEN an empty state "Sin jugadores activos" is displayed

### Requirement: Match results

The system MUST display the team's finished matches showing opponent, score, date, and round, sorted by date descending (most recent first).

#### Scenario: Team with finished matches

- GIVEN a team has 10 finished matches
- WHEN the team detail page renders
- THEN all 10 matches display with scores, ordered by date descending

#### Scenario: Team with no finished matches

- GIVEN a team has only scheduled matches
- WHEN the team detail page renders
- THEN an empty state "Sin partidos jugados" is displayed

### Requirement: Team statistics

The system MUST display the team's standing stats: Pts, PJ, PG, PE, PP, GF, GC, DG, TA, TR. If no standing record exists, the system SHALL display zeroes for all fields.

#### Scenario: Team with standing record

- GIVEN a team has Pts=9, PJ=3, PG=3 in the standings table
- WHEN the team detail page renders
- THEN the stats section shows Pts=9, PJ=3, PG=3

#### Scenario: Team without standing record

- GIVEN a team has no finished matches
- WHEN the team detail page renders
- THEN all stats display as zero

### Requirement: Top scorers

The system MUST display the team's top 10 goal scorers (name, total goals) across all finished matches, excluding own goals, sorted by total descending.

#### Scenario: Team with goals scored

- GIVEN a team's players have scored across multiple matches
- WHEN the team detail page renders
- THEN each scorer is shown with their goal count, ordered highest first

#### Scenario: Team with no goals

- GIVEN a team has no goals in any finished match
- WHEN the team detail page renders
- THEN an empty state "Sin goles registrados" is displayed

### Requirement: Standings link integration

The system MUST include the team's `id` in the `StandingEntry` interface. The standings table MUST render team names as `<Link href="/teams/{team.id}">`.

#### Scenario: Team name is a link in standings

- GIVEN a standings page with 4 teams
- WHEN the page renders
- THEN each team name is a clickable link to `/teams/{teamId}`

### Requirement: Navigation link

The public navigation MUST include an "Equipos" entry that navigates to `/standings`.

#### Scenario: Equipos link in header

- GIVEN any public page
- WHEN the header navigation renders
- THEN an "Equipos" link is present and navigates to `/standings`
