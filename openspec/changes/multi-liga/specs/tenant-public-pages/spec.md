# Tenant Public Pages Specification

## Purpose

Public routes SHALL be scoped per league under `/liga/[slug]/`. Each league has its own public face: standings, matches, teams, players, scorers, cards.

## Requirements

### Requirement: URL structure

Public pages MUST be accessible under `/liga/[slug]/` with the following routes:

| Route | Purpose | Current Equivalent |
|-------|---------|-------------------|
| `/liga/[slug]/standings` | League standings | `/standings?leagueId=X` |
| `/liga/[slug]/matches` | Match list | `/matches?leagueId=X` |
| `/liga/[slug]/teams` | Team directory | `/teams` |
| `/liga/[slug]/players` | Player directory | `/players` |
| `/liga/[slug]/scorers` | Top scorers | `/goleadores` |
| `/liga/[slug]/cards` | Card stats | `/tarjetas` |

#### Scenario: Public standings for a league

- GIVEN a League with slug "mi-liga" and 2 teams with finished matches
- WHEN an anonymous visitor navigates to `/liga/mi-liga/standings`
- THEN the page renders standings for that league's categories only
- AND data from other leagues is excluded

#### Scenario: Invalid slug returns 404

- GIVEN no league exists with slug "nonexistent"
- WHEN a visitor navigates to `/liga/nonexistent/standings`
- THEN the system returns 404 Not Found

### Requirement: Page-level data scoping

Every public page MUST resolve `slug` to `leagueId` (via middleware or layout), then scope all queries to that `leagueId`.

#### Scenario: Match list scoping

- GIVEN League A has 10 matches and League B has 5 matches
- WHEN a visitor views `/liga/league-a/matches`
- THEN exactly 10 matches are displayed

### Requirement: Middleware slug resolution

The system MUST resolve `slug` to `leagueId` in middleware and attach it to the request context for downstream use.

#### Scenario: Slug resolution in middleware

- GIVEN a request to `/liga/mi-liga/standings`
- WHEN the middleware runs
- THEN it queries the database for League with slug "mi-liga"
- AND attaches the resolved leagueId to the request

### Requirement: Old URL redirects

Old flat URLs (`/standings`, `/matches`, `/goleadores`, `/tarjetas`, `/teams`, `/players`) MUST redirect to their `/liga/[slug]/` equivalents, or show a league picker if no default league.

#### Scenario: Visitor bookmarked old URL

- GIVEN the old URL `/standings`
- WHEN a visitor navigates to it
- THEN they are redirected (301) to the default league's standings
- OR shown a league picker if they are not authenticated and have no cookie

### Requirement: Homepage league directory

The homepage `/` MUST show a directory of active leagues with links to their public pages, plus a CTA to "Create your league" (if unauthenticated) or "Go to my admin" (if authenticated with league).

#### Scenario: Unauthenticated homepage

- GIVEN no active session
- WHEN a visitor lands on `/`
- THEN they see a list of public leagues with links to `/liga/[slug]/standings`
- AND a "Create your league" call-to-action

#### Scenario: Authenticated homepage

- GIVEN an authenticated Admin with `leagueId` set
- WHEN they visit `/`
- THEN they are redirected to `/admin`
