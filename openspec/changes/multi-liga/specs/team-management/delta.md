# Delta for Team Management

## ADDED Requirements

### Requirement: Admin query scoping by league

All admin server actions for teams MUST be scoped to the admin's league. Teams are scoped through the `Category → League` relationship chain.

#### Scenario: Admin sees own league teams only

- GIVEN Admin A (league-a) with categories including "U12" and "Senior"
- WHEN Admin A queries teams via `/admin/teams`
- THEN only teams belonging to league-a's categories are returned

#### Scenario: Category selector filtered by league

- GIVEN the team creation form has a category dropdown
- WHEN Admin A opens the dropdown
- THEN only categories belonging to league-a are listed

### Requirement: ensureScope via category chain

When editing a team, the system MUST verify that the team's `category.leagueId` matches the admin's `session.user.leagueId`.

#### Scenario: Cross-tenant team edit rejected

- GIVEN Admin A (league-a) and Team X belongs to league-b
- WHEN Admin A tries to edit Team X
- THEN `ensureScope()` checks Team → Category → League → leagueId
- AND the edit is rejected with "Access denied"

#### Scenario: Cross-tenant team creation prevented

- GIVEN Admin A with `leagueId: league-a`
- WHEN Admin A submits a team form with a category from league-b (injected)
- THEN the server action is rejected because the category does not belong to the admin's league
