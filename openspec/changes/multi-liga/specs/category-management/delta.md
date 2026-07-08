# Delta for Category Management

## ADDED Requirements

### Requirement: Admin query scoping by league

All admin server actions for categories MUST filter by `session.user.leagueId` via the `ensureScope()` pattern.

#### Scenario: Admin sees own league categories only

- GIVEN Admin A (league-a) and Admin B (league-b)
- WHEN Admin A queries categories
- THEN only categories with `leagueId: league-a` are returned

#### Scenario: Cross-tenant category creation rejected

- GIVEN Admin A with `leagueId: league-a`
- WHEN Admin A submits a category with a different `leagueId` (injected via request)
- THEN the server action overrides the leagueId to `league-a` before persisting
- AND the category is created under league-a

## MODIFIED Requirements

### Requirement: Category CRUD

The system MUST support create, read, update, and delete category records within a league. The `leagueId` is inferred from the admin's session, not from user input.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes | e.g. "U12", "Senior" |
| min_age | integer | yes | Minimum age for the category |
| max_age | integer | yes | Maximum age for the category |
| league_id | UUID | yes | Inferred from session, not user-supplied |

(Previously: league_id was submitted by the admin. Now inferred from session.)

#### Scenario: Admin creates a category

- GIVEN an authenticated admin with `leagueId: league-a`
- WHEN the admin creates a category "U12" with min_age 10 and max_age 12
- THEN the category is created with `leagueId: league-a` (from session)

#### Scenario: Admin updates a category

- GIVEN an existing category "U12" with max_age 12
- WHEN the admin updates max_age to 13
- THEN the category age range is updated

#### Scenario: Admin deletes a category

- GIVEN a category with no teams or matches
- WHEN the admin deletes the category
- THEN the category is removed

#### Scenario: Delete category with teams rejected

- GIVEN a category that has registered teams
- WHEN the admin tries to delete the category
- THEN the system MUST reject the deletion (referential integrity)

### Requirement: Category scoping

No change — categories already belong to exactly one league via `leagueId`.

### Requirement: Admin-only operations

No change — only authenticated admins create, update, or delete categories.
