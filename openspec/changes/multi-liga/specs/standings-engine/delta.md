# Delta for Standings Engine

## ADDED Requirements

### Requirement: Standings scoped by league

Standings are already scoped to a Category, which belongs to a League. No schema change is needed. The standings engine SHALL ensure that only matches within the league's categories are included in calculations.

#### Scenario: Standings only include league matches

- GIVEN League A has Category U12, League B has Category Senior
- WHEN standings are calculated for Category U12
- THEN only matches from Category U12 (League A) are included
- AND matches from Category Senior (League B) are excluded

### Requirement: ensureScope for standings recalculation

The standings recalculation trigger MUST verify that the match's `category.leagueId` matches the admin's `session.user.leagueId`.

#### Scenario: Cross-tenant standings trigger rejected

- GIVEN Admin A (league-a)
- WHEN Admin A triggers manual standings recalculation for a category in league-b
- THEN the system rejects with "Access denied"

## MODIFIED Requirements

### Requirement: Standings update trigger

Standings SHALL recalculate automatically after every match status change to `finished` within the admin's league, and after any goal or card edit on a finished match in that league. The trigger MUST scope the recalculation to the league of the match being edited.

(Previously: Global scope — no league check on trigger.)

#### Scenario: Recalculate after match in own league

- GIVEN Admin A owns league-a, and a match in league-a is set to `finished`
- WHEN the match status changes
- THEN standings for the match's category are recalculated within the same transaction
- AND only league-a's standings are affected

#### Scenario: Cross-tenant match does not trigger foreign recalc

- GIVEN Admin A is editing a match in league-a
- WHEN the match is set to `finished`
- THEN standings in league-b are NOT recalculated
- AND standings in league-a ARE recalculated
