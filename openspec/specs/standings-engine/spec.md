# Standings Engine Specification

## Purpose

Derive team standings from match results per category. The engine calculates points, played games, wins, draws, losses, goals for/against, goal difference, card totals, and position. Standings update after each finished match.

## Requirements

### Requirement: Standings calculation

The system MUST derive standings from finished match results for each category.

| Field | Calculation |
|-------|------------|
| Pts | Win = 3, Draw = 1, Loss = 0 |
| PJ | Total matches played |
| PG | Matches where local_score > visitor_score (for local) or vice versa (for visitor) |
| PE | Matches where scores are equal |
| PP | Matches where team lost |
| GF | Goals scored (excluding own goals against) |
| GC | Goals conceded (including own goals against) |
| DG | GF - GC |
| TA | Sum of yellow cards across all matches |
| TR | Sum of red cards across all matches |

#### Scenario: Standings after one match

- GIVEN a category with 2 teams and 1 finished match: Team A 3-1 Team B
- WHEN standings are calculated
- THEN Team A has: Pts=3, PJ=1, PG=1, GF=3, GC=1, DG=+2
- AND Team B has: Pts=0, PJ=1, PP=1, GF=1, GC=3, DG=-2

#### Scenario: Draw result

- GIVEN a finished match Team A 2-2 Team B
- WHEN standings are calculated
- THEN both teams have Pts=1, PE=1

### Requirement: Standing sorting

Standings MUST be sorted by: points descending, then goal difference descending, then goals for descending, then alphabetical.

#### Scenario: Tiebreaker by goal difference

- GIVEN Team A and Team B both have 6 points, but Team A has DG +4 and Team B has DG +2
- WHEN standings are sorted
- THEN Team A is ranked above Team B

#### Scenario: Full tiebreaker chain

- GIVEN teams A, B, C all with 4 points, 0 DG, 3 GF
- WHEN standings are sorted
- THEN they are ordered alphabetically

### Requirement: Standings edge cases

#### Scenario: Zero matches played

- GIVEN a category with 4 teams and no finished matches
- WHEN standings are calculated
- THEN all teams have zeroes in all stat columns
- AND positions are alphabetical

#### Scenario: Incomplete round

- GIVEN a category where round 1 has 3 of 4 matches finished
- WHEN standings are calculated
- THEN standings reflect only the finished matches
- AND teams with no finished matches show zeroes

#### Scenario: Walkover (forfeit) result

- GIVEN a match marked as walkover where Team A wins 1-0 by forfeit
- WHEN standings are calculated
- THEN Team A gets 3 points, GF+1
- AND Team B gets 0 points, GC+1 (or configurable walkover rules)

### Requirement: Standings update trigger

Standings SHALL recalculate automatically after every match status change to `finished`, and after any goal or card edit on a finished match.

#### Scenario: Recalculate after match result entered

- GIVEN standings exist for a category
- WHEN a match in that category is set to `finished` with scores
- THEN standings are recalculated and updated within the same transaction
