# Schema Changes Specification

## Purpose

Define the Prisma schema changes required for multi-tenant support. All changes are additive or updative — no destructive changes.

## Requirements

### Requirement: League.slug field

League MUST gain a `slug` string field, globally unique, set on creation, and immutable after creation.

#### Scenario: Schema validates

- GIVEN the Prisma schema after migration
- WHEN a League is created with a unique slug
- THEN the record is persisted

#### Scenario: Duplicate slug rejected

- GIVEN an existing league with slug "mi-liga"
- WHEN a new league is created with the same slug
- THEN the database rejects with unique constraint violation

### Requirement: Admin.leagueId field

Admin MUST gain a nullable `leagueId` field with a foreign key to League. Null means the admin is either SUPER_ADMIN or has not created a league yet.

#### Scenario: ADMIN has leagueId set

- GIVEN an Admin with role `ADMIN` assigned to a league
- WHEN querying the Admin
- THEN `leagueId` is non-null and references a valid League

#### Scenario: SUPER_ADMIN has null leagueId

- GIVEN an Admin with role `SUPER_ADMIN`
- WHEN querying the Admin
- THEN `leagueId` is null

### Requirement: Cascade deletes

League deletion MUST cascade to all its scoped entities. Existing `onDelete: Restrict` on Category → League MUST change to `onDelete: Cascade`. All downstream relations (Team → Category, Match → Category, Standing → Category) SHALL also cascade.

#### Scenario: Full cascade chain

- GIVEN a League (id: league-a) with Categories → Teams → Players → Matches → Goals/Cards → Standings
- WHEN the League is deleted
- THEN all Categories, Teams, Players, Matches, Goals, Cards, and Standings with that leagueId are deleted
- AND Courts are NOT affected

### Requirement: Category.leagueId cascade update

Existing `Category.leagueId` FK `onDelete` behavior MUST change from `Restrict` to `Cascade`.

#### Scenario: Category cascade on league delete

- GIVEN a Category tied to a League
- WHEN the League is deleted
- THEN the Category is cascade-deleted (not restricted)
