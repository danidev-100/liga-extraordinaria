# SUPER_ADMIN Switcher Specification

## Purpose

SUPER_ADMIN users (role `SUPER_ADMIN`, `leagueId: null`) can browse, view, and manage any league's data. A league switcher UI component enables quick context switching.

## Requirements

### Requirement: League switcher component

The system MUST provide a league switcher dropdown in the admin sidebar for SUPER_ADMIN users listing all leagues.

#### Scenario: SUPER_ADMIN sees league switcher

- GIVEN a logged-in SUPER_ADMIN with no `leagueId`
- WHEN viewing the admin sidebar
- THEN a dropdown labeled "League:" shows all leagues
- AND the currently selected league is highlighted

#### Scenario: Switching leagues

- GIVEN a SUPER_ADMIN viewing league A's data
- WHEN they select league B from the switcher
- THEN all admin pages now show league B's data
- AND the URL updates to reflect the selected league

### Requirement: SUPER_ADMIN session context

SUPER_ADMIN session SHALL contain `leagueId: null`. The league switcher SHALL set a cookie or query param (`?leagueId=...`) that overrides the scope for admin queries.

#### Scenario: Null leagueId in session

- GIVEN a SUPER_ADMIN
- WHEN the session JWT is decoded
- THEN `leagueId` is `null` and `role` is `SUPER_ADMIN`

#### Scenario: Query override via param

- GIVEN a SUPER_ADMIN viewing `/admin`
- WHEN a `leagueId` cookie or query param is set to "league-b"
- THEN all admin queries scope to "league-b" (not unrestricted)

### Requirement: Unrestricted queries

SUPER_ADMIN with no league override MUST see all data across all leagues.

#### Scenario: SUPER_ADMIN sees all teams

- GIVEN a SUPER_ADMIN with no league override
- WHEN they visit `/admin/teams`
- THEN teams from all leagues are displayed
- AND each team row shows which league it belongs to

#### Scenario: SUPER_ADMIN analytics

- GIVEN a SUPER_ADMIN with no league override
- WHEN viewing the admin dashboard analytics
- THEN charts aggregate data across ALL leagues
- AND an "All Leagues" label is shown

### Requirement: SUPER_ADMIN can own a league

A SUPER_ADMIN MAY create a league, which assigns them a `leagueId` for that specific league while retaining `SUPER_ADMIN` role.

#### Scenario: SUPER_ADMIN creates league

- GIVEN a SUPER_ADMIN with `leagueId: null`
- WHEN they create a new league via `/create-league`
- THEN a new league is created
- AND the SUPER_ADMIN's `leagueId` remains `null` (they keep global access)
- AND the league is owned by the SUPER_ADMIN (implicitly)
