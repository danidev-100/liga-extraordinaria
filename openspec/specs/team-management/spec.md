# Team Management Specification

## Purpose

Manage teams within a category. Each team has a name, short name, colors, and optional logo. Teams compete in matches within their category. Admin-only CRUD.

## Requirements

### Requirement: Team CRUD

The system MUST support create, read, update, and delete team records.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes | Full team name |
| short_name | string | yes | e.g. "RFC" for "Real FC" |
| logo_url | string | no | URL to team logo |
| category_id | UUID | yes | Foreign key to Category |
| color | string | no | Primary team color (hex) |

#### Scenario: Admin creates a team

- GIVEN an authenticated admin and an existing category
- WHEN the admin creates a team "Real FC" with short_name "RFC" in category "U12"
- THEN the team is persisted under that category

#### Scenario: Admin updates a team

- GIVEN an existing team "Real FC" with color null
- WHEN the admin sets color to "#FF0000"
- THEN the team color is updated

#### Scenario: Admin deletes a team

- GIVEN a team with no players or matches
- WHEN the admin deletes the team
- THEN the team is removed

#### Scenario: Delete team with players rejected

- GIVEN a team that has registered players
- WHEN the admin tries to delete the team
- THEN the system MUST reject the deletion

### Requirement: Team scoping

Each team MUST belong to exactly one category. A team only competes within its category's matches.

#### Scenario: Teams by category

- GIVEN category "U12" with 4 teams and category "Senior" with 6 teams
- WHEN querying teams for "U12"
- THEN exactly 4 teams are returned

### Requirement: Unique team names

Team name SHALL be unique within a category but MAY repeat across categories.

#### Scenario: Duplicate name within same category rejected

- GIVEN category "U12" already has a team "Real FC"
- WHEN the admin creates another team "Real FC" in the same category
- THEN the system MUST reject with a duplicate name error

#### Scenario: Same name across categories allowed

- GIVEN category "U12" has a team "Real FC"
- WHEN the admin creates a team "Real FC" in category "Senior"
- THEN the creation succeeds
