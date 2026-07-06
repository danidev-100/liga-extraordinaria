# League Configuration Specification

## Purpose

Manage league/tournament metadata: name, season, dates, and active status. Only admins can create, update, or delete leagues. The active league is the current operational context.

## Requirements

### Requirement: League CRUD

The system MUST support create, read, update, and delete operations for league records.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes | League display name |
| season | string | yes | e.g. "2026" or "2026-2027" |
| start_date | date | yes | First match day |
| end_date | date | yes | Last match day |
| is_active | boolean | no | Default: false. Only one league active at a time |

#### Scenario: Admin creates a league

- GIVEN an authenticated admin
- WHEN the admin creates a league with name "Liga Verano 2026", season "2026", and valid dates
- THEN the league is persisted with `is_active: false`

#### Scenario: Admin updates a league

- GIVEN an existing league with `name: "Liga Verano 2026"`
- WHEN the admin changes the name to "Liga Verano 2027"
- THEN the league name is updated

#### Scenario: Admin deletes a league

- GIVEN an existing league with no matches, categories, or teams
- WHEN the admin deletes the league
- THEN the league is removed from the system

#### Scenario: Delete league with dependencies rejected

- GIVEN an existing league that has categories and associated data
- WHEN the admin tries to delete the league
- THEN the system MUST reject the deletion with a referential integrity error

### Requirement: Active league management

Only one league MAY be active at a time. Setting a league as active MUST deactivate the current active league.

#### Scenario: Activate a league

- GIVEN league A is active and league B is inactive
- WHEN the admin sets league B as active
- THEN league A becomes inactive
- AND league B becomes active

### Requirement: Admin-only league operations

Only authenticated admins SHALL create, update, or delete leagues.

#### Scenario: Unauthenticated create rejected

- GIVEN an unauthenticated user
- WHEN the user sends a request to create a league
- THEN the system returns a 401 Unauthorized error

#### Scenario: Read accessible to all

- GIVEN any user (authenticated or not)
- WHEN the user reads the league list
- THEN the system returns league data (public read)
