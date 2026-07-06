# Match Management Specification

## Purpose

Schedule and manage matches: fixture creation, score entry, goal recording, and status transitions. Matches are scoped to a category and assigned to a court. Admin-only create, update, and delete.

## Requirements

### Requirement: Match scheduling

The system MUST support creating match fixtures with the following fields.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| category_id | UUID | yes | Scopes the match |
| court_id | UUID | yes | Where the match is played |
| date | date | yes | Match date |
| time | time | yes | Match start time |
| local_team_id | UUID | yes | Home team |
| visitor_team_id | UUID | yes | Away team |
| round | integer | yes | Round number |
| status | enum | yes | `scheduled` | `playing` | `finished` |

#### Scenario: Admin schedules a match

- GIVEN an authenticated admin, a category with 2 teams, and an available court
- WHEN the admin creates a match with both teams, court, date, time, and round 1
- THEN the match is created with status `scheduled`

#### Scenario: Match with same local and visitor rejected

- GIVEN a category with one team
- WHEN the admin creates a match where local and visitor teams are the same
- THEN the system MUST reject with "teams must be different"

### Requirement: Score entry

When a match status changes to `finished`, the admin MUST enter `local_score` and `visitor_score`.

#### Scenario: Finish match with scores

- GIVEN a match with status `scheduled`
- WHEN the admin sets status to `finished` with scores 3-1
- THEN the match is saved with status `finished`, local_score 3, visitor_score 1

#### Scenario: Finish match without scores rejected

- GIVEN a match with status `scheduled`
- WHEN the admin sets status to `finished` without entering scores
- THEN the system MUST reject the status change

### Requirement: Goal recording

Each match SHALL support recording individual goals per player.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| match_id | UUID | yes | Foreign key to Match |
| player_id | UUID | yes | Scorer |
| team_id | UUID | yes | Player's team |
| minute | integer | yes | Minute of the goal |
| is_own_goal | boolean | no | Default: false |

#### Scenario: Record a goal

- GIVEN a finished match
- WHEN the admin records a goal for player Juan Pérez at minute 23
- THEN the goal is persisted and linked to the match

#### Scenario: Own goal recorded

- GIVEN a finished match
- WHEN the admin records a goal as own_goal for player Carlos at minute 45
- THEN the goal is saved with `is_own_goal: true`

### Requirement: Transactional match result entry

The system MUST use Prisma transactions to ensure goals, cards, and match score are saved atomically. A partial save MUST NOT occur.

#### Scenario: Atomic transaction rollback

- GIVEN a match result being entered with 2 goals and 1 card
- WHEN the card insertion fails due to a constraint violation
- THEN the entire transaction MUST roll back
- AND the match status MUST remain `scheduled`

### Requirement: Court availability validation

The system MUST validate that no other match is scheduled on the same court at the same date and time before creating a match.

#### Scenario: Court conflict prevented

- GIVEN a match at Cancha Central on 2026-07-10 15:00
- WHEN creating another match at the same court and time
- THEN the system rejects with a scheduling conflict error
