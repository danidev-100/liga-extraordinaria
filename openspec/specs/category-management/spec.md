# Category Management Specification

## Purpose

Manage age-group categories (e.g., "U12", "U15", "Senior") within a league. Each category scopes its own teams, matches, and standings. Admin-only create, update, delete.

## Requirements

### Requirement: Category CRUD

The system MUST support create, read, update, and delete category records within a league.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes | e.g. "U12", "Senior" |
| min_age | integer | yes | Minimum age for the category |
| max_age | integer | yes | Maximum age for the category |
| league_id | UUID | yes | Foreign key to League |

#### Scenario: Admin creates a category

- GIVEN an authenticated admin and an existing league
- WHEN the admin creates a category "U12" with min_age 10 and max_age 12
- THEN the category is created under the specified league

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

Each category MUST belong to exactly one league. Teams, matches, and standings are scoped within a category.

#### Scenario: Category belongs to league

- GIVEN a category "U12" under league "Liga Verano 2026"
- WHEN querying categories for that league
- THEN the result includes "U12"

#### Scenario: Category isolation

- GIVEN category "U12" and category "Senior" in different leagues
- WHEN querying categories for one league
- THEN categories from the other league are not returned

### Requirement: Admin-only operations

Only authenticated admins SHALL create, update, or delete categories. Category reads SHOULD be public.

#### Scenario: Unauthenticated delete rejected

- GIVEN an unauthenticated user
- WHEN the user attempts to delete a category
- THEN the system returns 401 Unauthorized
