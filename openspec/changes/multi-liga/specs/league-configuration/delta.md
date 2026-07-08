# Delta for League Configuration

## ADDED Requirements

### Requirement: Slug uniqueness and generation

The system MUST generate a URL-friendly `slug` from the league name on creation. Slug MUST be globally unique across all leagues.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| slug | string | yes | Auto-generated from name, editable, globally unique |

#### Scenario: Auto-generated slug

- GIVEN league name "Liga Verano 2026"
- WHEN the league is created
- THEN slug is "liga-verano-2026"

#### Scenario: Slug collision auto-resolved

- GIVEN slug "liga-verano-2026" exists
- WHEN another league with name "Liga Verano 2026" is created
- THEN slug becomes "liga-verano-2026-abc1" (random suffix appended)

### Requirement: Cascade deletion

Deleting a league MUST cascade-delete all scoped data: categories, teams, players, matches, goals, cards, standings. Courts MUST NOT be deleted.

#### Scenario: Delete league cascades

- GIVEN a league with 3 categories, 10 teams, 50 players, 20 matches
- WHEN the league is deleted
- THEN all categories, teams, players, matches, standings, goals, and cards for that league are removed
- AND courts remain intact

#### Scenario: Delete league with no data

- GIVEN an empty league with no related data
- WHEN the league is deleted
- THEN the league record is removed (no cascade needed)

## MODIFIED Requirements

### Requirement: League CRUD

The system MUST support create, read, update, and delete operations for league records. Slug is required on create, immutable after creation.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes | League display name |
| season | string | yes | e.g. "2026" or "2026-2027" |
| slug | string | yes | Globally unique, set on creation |
| start_date | date | yes | First match day |
| end_date | date | yes | Last match day |
| is_active | boolean | no | Default: false. Per-tenant active |

(Previously: No slug field. Singleton isActive.)

#### Scenario: Admin creates a league

- GIVEN an authenticated admin with `leagueId: null`
- WHEN the admin creates a league with name "Liga Verano 2026"
- THEN the league is persisted with `is_active: true` for that league
- AND the admin's `leagueId` is set to the new league

#### Scenario: Admin updates a league

- GIVEN an existing league
- WHEN the admin updates the name
- THEN the league name is updated (slug stays unchanged)

#### Scenario: Admin deletes a league with confirmation

- GIVEN a league with related data
- WHEN the admin clicks delete and confirms
- THEN all scoped data is cascade-deleted (via Prisma cascade)

### Requirement: Active league management

Each league MAY have its own active status independent of other leagues. Setting a league active SHALL NOT affect other leagues' active status.

(Previously: Singleton — only one league could be active at a time.)

#### Scenario: Activate a league per-tenant

- GIVEN league A is active and league B is active (both active independently)
- WHEN the admin sets league C as active
- THEN league C becomes active
- AND league A and league B remain active (no deactivation)

### Requirement: Admin-only league operations

Only the league owner (Admin with matching `leagueId`) SHALL update or delete their league. SUPER_ADMIN SHALL update/delete any league.

(Previously: Any authenticated admin could operate on any league.)

#### Scenario: Unauthenticated create rejected

- GIVEN an unauthenticated user
- WHEN the user sends a request to create a league
- THEN the system returns a 401 Unauthorized error

#### Scenario: Non-owner update rejected

- GIVEN Admin A owns League A
- WHEN Admin B (different leagueId) tries to update League A
- THEN the system returns 403 Forbidden

#### Scenario: SUPER_ADMIN can update any league

- GIVEN a SUPER_ADMIN with `leagueId: null`
- WHEN they update any league
- THEN the update succeeds
