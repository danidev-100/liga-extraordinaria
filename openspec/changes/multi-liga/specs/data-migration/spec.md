# Data Migration Specification

## Purpose

Define the migration path for existing data. The current single-league setup must be backfilled to multi-tenant schema without data loss.

## Requirements

### Requirement: Schema migration

The system MUST add `slug` to League (nullable initially, then unique+required after backfill) and `leagueId` (nullable) to Admin.

#### Scenario: Migration runs cleanly

- GIVEN a database with existing League and Admin records
- WHEN the Prisma migration runs
- THEN `slug` column is added to `leagues` table (nullable)
- AND `league_id` column is added to `admins` table (nullable)

### Requirement: Slug backfill

Every existing League MUST get a unique slug derived from its name.

#### Scenario: Single league backfill

- GIVEN one League with name "Liga Deportiva 2026"
- WHEN the backfill script runs
- THEN the league's slug is set to "liga-deportiva-2026"

#### Scenario: Multiple leagues same name

- GIVEN two leagues both named "Liga Deportiva 2026"
- WHEN the backfill script runs
- THEN the second league's slug gets a random suffix (e.g. "liga-deportiva-2026-x7k9")

### Requirement: Admin backfill

Every existing Admin MUST either be assigned to the existing league (if role `ADMIN`) or keep `leagueId: null` (if role `SUPER_ADMIN`).

#### Scenario: Existing ADMIN assigned to first league

- GIVEN an existing Admin with role `ADMIN` (no leagueId)
- WHEN the backfill script runs
- THEN the Admin's `leagueId` is set to the first/only league's id

#### Scenario: Existing SUPER_ADMIN stays unassigned

- GIVEN an existing Admin with role `SUPER_ADMIN`
- WHEN the backfill script runs
- THEN `leagueId` remains `null`

### Requirement: Slug uniqueness constraint

After backfill, the `slug` field MUST be set to `@unique`.

#### Scenario: Post-backfill constraint enforced

- GIVEN all slugs are backfilled and unique
- WHEN attempting to create a league with an existing slug
- THEN the database rejects with a unique constraint violation

### Requirement: Cascade constraint update

The `Category → League` relation MUST change from `onDelete: Restrict` to `onDelete: Cascade` to enable league deletion.

#### Scenario: Cascade constraint applied

- GIVEN a League with categories and related data
- WHEN the League is deleted
- THEN all categories and their related records cascade-delete (via Prisma cascade chain)
