# Public Player Profile Specification

## Purpose

Provide public read-only access to player profile pages — bio info, goal history, card history, and aggregate stats. Link player names in goleadores and tarjetas tables to their profile pages.

## Requirements

### Requirement: Player page routing

The system MUST expose a route at `/players/[id]` that renders a public player profile. When no player matches the given `id`, the system MUST call `notFound()` to return a 404.

#### Scenario: Existing player renders profile

- GIVEN a player with id "xyz-789" exists
- WHEN navigating to `/players/xyz-789`
- THEN the page renders with the player's bio, goals, cards, and stats

#### Scenario: Non-existent player returns 404

- GIVEN no player exists with the id "nonexistent"
- WHEN navigating to `/players/nonexistent`
- THEN the system renders a 404 page

### Requirement: Bio display

The system MUST display the player's name, surname, jersey number, team name (as a link to `/teams/{teamId}`), and birth date.

#### Scenario: Player with full bio

- GIVEN a player with jersey number 10 on team "Real FC"
- WHEN the player profile renders
- THEN name, surname, jersey number, team link, and birth date are shown
- AND the team name links to `/teams/{teamId}`

### Requirement: Goal history

The system MUST display a table of goals scored by the player in finished matches. Each row SHALL show match date, opponent team, minute, and own-goal indicator. Rows SHALL be sorted by match date descending.

#### Scenario: Player with goals

- GIVEN a player has scored 5 goals across 3 matches
- WHEN the player profile renders
- THEN all 5 goals are listed with match date, opponent, and minute, ordered by date descending

#### Scenario: Player with no goals

- GIVEN a player has scored 0 goals in any finished match
- WHEN the player profile renders
- THEN an empty state "Sin goles registrados" is displayed

### Requirement: Card history

The system MUST display a table of cards received by the player in finished matches. Each row SHALL show match date, opponent team, card type (yellow/red), and minute. Rows SHALL be sorted by match date descending.

#### Scenario: Player with cards

- GIVEN a player has 2 yellows and 1 red
- WHEN the player profile renders
- THEN all 3 cards are listed with type and minute, ordered by date descending

#### Scenario: Player with no cards

- GIVEN a player has 0 cards
- WHEN the player profile renders
- THEN an empty state "Sin tarjetas" is displayed

### Requirement: Stats summary

The system MUST display aggregate totals: total goals (excluding own goals), total yellow cards, and total red cards.

#### Scenario: Player stats computed

- GIVEN a player with 8 goals, 3 yellows, 1 red
- WHEN the player profile renders
- THEN the stats section shows Goals=8, Yellow=3, Red=1

### Requirement: Scorer and card table link integration

The system MUST render player names in goleadores and tarjetas tables as `<Link href="/players/{playerId}">`.

#### Scenario: Goleadores player name is a link

- GIVEN the goleadores page lists top scorers
- WHEN the page renders
- THEN each player name is a clickable link to `/players/{playerId}`

#### Scenario: Tarjetas player name is a link

- GIVEN the tarjetas page lists players with cards
- WHEN the page renders
- THEN each player name is a clickable link to `/players/{playerId}`
