# Card Tracking Specification

## Purpose

Track yellow and red cards per player per match. Card accumulation totals appear in standings (TA = total yellows, TR = total reds). Admin-only create, read.

## Requirements

### Requirement: Card recording

The system MUST support recording individual cards during a match.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| match_id | UUID | yes | Foreign key to Match |
| player_id | UUID | yes | Card recipient |
| team_id | UUID | yes | Player's team |
| type | enum | yes | `yellow` or `red` |
| minute | integer | yes | Minute when card was shown |

#### Scenario: Admin records a yellow card

- GIVEN a finished match with player Juan Pérez
- WHEN the admin records a yellow card for Juan at minute 35
- THEN the card is persisted with type `yellow`

#### Scenario: Admin records a red card

- GIVEN a finished match with player Carlos Silva
- WHEN the admin records a red card for Carlos at minute 78
- THEN the card is persisted with type `red`

### Requirement: Card accumulation in standings

The system MUST sum total yellow cards (TA) and total red cards (TR) per team across all matches for display in standings.

#### Scenario: Accumulated cards appear in standings

- GIVEN Team A has 3 yellow cards and 1 red card across 2 matches
- WHEN standings are calculated
- THEN Team A's TA = 3 and TR = 1

### Requirement: Multiple cards per player per match

A player MAY receive more than one card in a single match (e.g., second yellow → red). Each card MUST be recorded as a separate record.

#### Scenario: Player gets two yellows then red

- GIVEN a match where player Juan Pérez receives yellow at minute 30 and yellow at minute 65 (second yellow = red)
- WHEN the admin records both cards
- THEN there are 3 card records: 2 yellows, 1 red
- AND TA counts 2 yellows for that player, TR counts 1 red

### Requirement: Card read access

Card records SHALL be readable via match details. Only admins SHALL create cards.

#### Scenario: Public reads cards

- GIVEN a finished match with 3 cards recorded
- WHEN any user views the match detail page
- THEN the card list is visible

#### Scenario: Unauthenticated card creation rejected

- GIVEN an unauthenticated user
- WHEN the user attempts to create a card record
- THEN the system returns 401 Unauthorized
