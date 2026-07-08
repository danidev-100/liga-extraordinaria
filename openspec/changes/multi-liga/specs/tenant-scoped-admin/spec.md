# Tenant-Scoped Admin Specification

## Purpose

Every admin page and action MUST scope data to the authenticated user's league via `session.user.leagueId`. Ensure that ADMIN users never see or modify data belonging to another league.

## Requirements

### Requirement: Session-based league scoping

All admin server actions MUST read the current user's `leagueId` from the session and filter all Prisma queries by it.

#### Scenario: Admin sees only their league's teams

- GIVEN Admin A belongs to League A (id: league-a) and Admin B belongs to League B (id: league-b)
- WHEN Admin A visits `/admin/teams`
- THEN only teams in League A are returned
- AND Admin A cannot see League B's teams

#### Scenario: Admin creates data scoped to their league

- GIVEN an authenticated Admin with `leagueId: league-a`
- WHEN the admin creates a category "U12"
- THEN the category is created with `leagueId: league-a`

### Requirement: Cross-tenant access rejection (ensureScope)

The system MUST implement an `ensureScope(resource)` helper that verifies `resource.leagueId === session.user.leagueId` and throws if mismatched.

#### Scenario: Cross-tenant edit rejected

- GIVEN Admin A with `leagueId: league-a`
- WHEN Admin A submits an edit to a category whose `leagueId` is `league-b`
- THEN `ensureScope()` throws "Access denied: resource belongs to a different league"
- AND the edit is NOT persisted

#### Scenario: SUPER_ADMIN bypasses ensureScope

- GIVEN a SUPER_ADMIN with `leagueId: null` and role `SUPER_ADMIN`
- WHEN the SUPER_ADMIN edits a category in any league
- THEN `ensureScope()` returns true (bypass)
- AND the edit succeeds

### Requirement: Sidebar shows league context

The admin sidebar MUST display the current user's league name and provide navigation scoped to that league.

#### Scenario: League name in sidebar

- GIVEN an authenticated ADMIN for league "Mi Liga"
- WHEN the admin navigates to `/admin`
- THEN the sidebar shows "Mi Liga" as the league name
- AND all nav links point to `/admin/categories`, `/admin/teams`, etc.

#### Scenario: SUPER_ADMIN sidebar

- GIVEN a SUPER_ADMIN (no leagueId)
- WHEN the SUPER_ADMIN navigates to `/admin`
- THEN the sidebar shows "All Leagues" or similar
- AND a league switcher is visible

### Requirement: Admin page redirects for users without league

- GIVEN an Admin with `leagueId: null` (registered but no league yet)
- WHEN they access `/admin`
- THEN they are redirected to `/create-league`
