# League Creation Specification

## Purpose

Allow an authenticated user (who has no league) to create a new league and become its ADMIN owner. This is the step immediately after registration.

## Requirements

### Requirement: League creation form

The system MUST provide a league creation page at `/create-league` with fields: name, season, start date, end date. Slug SHALL be auto-generated from name with option to edit.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes | Display name |
| season | string | yes | e.g. "2026" |
| start_date | date | yes | First match day |
| end_date | date | yes | Last match day |
| slug | string | yes | Auto-generated, editable, unique |

#### Scenario: Create league with auto-generated slug

- GIVEN an authenticated Admin with `leagueId: null`
- WHEN the admin submits name "Mi Liga 2026", season "2026", and valid dates
- THEN the system creates a League with slug "mi-liga-2026"
- AND sets the Admin's `leagueId` to the new League's id
- AND redirects to `/admin` with the league name in the sidebar

#### Scenario: Slug collision auto-resolved

- GIVEN a League with slug "mi-liga-2026" already exists
- WHEN a user creates a new league with the same name
- THEN the system appends a random suffix (e.g. "mi-liga-2026-a3f2")
- AND creation succeeds

#### Scenario: Manual slug override

- GIVEN the auto-generated slug is "mi-liga-2026"
- WHEN the user edits the slug to "torneo-2026"
- AND "torneo-2026" is not taken
- THEN the league is created with slug "torneo-2026"

### Requirement: Slug uniqueness

Slug MUST be globally unique across all leagues. Duplicate slugs MUST be rejected (or auto-resolved as above).

#### Scenario: Duplicate manual slug rejected

- GIVEN an existing slug "torneo-2026"
- WHEN a user tries to create a league with the same slug
- THEN the system shows "Slug already taken" error
- AND suggests alternatives

### Requirement: Creator becomes ADMIN owner

The user who creates the league MUST become its ADMIN. The league SHALL have exactly one owner.

#### Scenario: Owner assignment

- GIVEN an authenticated Admin with `leagueId: null`
- WHEN the admin creates a league
- THEN the Admin's `leagueId` is set to the new league's id
- AND the Admin's `role` remains `ADMIN`

#### Scenario: Already-owned user cannot create

- GIVEN an authenticated Admin with non-null `leagueId`
- WHEN they navigate to `/create-league`
- THEN they are redirected to `/admin`
- AND the creation form is not accessible

### Requirement: Validation

#### Scenario: Invalid dates rejected

- GIVEN `end_date` is before `start_date`
- WHEN the user submits the form
- THEN the system returns "End date must be after start date"
