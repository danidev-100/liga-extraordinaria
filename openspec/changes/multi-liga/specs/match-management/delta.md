# Delta for Match Management

## ADDED Requirements

### Requirement: Admin query scoping by league

All admin server actions for matches MUST be scoped to the admin's league. Matches are scoped through the `Category → League` relationship chain.

#### Scenario: Admin sees own league matches only

- GIVEN Admin A (league-a) and Admin B (league-b)
- WHEN Admin A queries matches via `/admin/matches`
- THEN only matches in categories belonging to league-a are returned

#### Scenario: Category and team selectors filtered

- GIVEN the match creation form has category, local team, and visitor team dropdowns
- WHEN Admin A opens any dropdown
- THEN only data belonging to league-a is shown

### Requirement: Courts remain global

Court selection in the match form SHALL show all courts (not scoped by league).

#### Scenario: Admin sees all courts

- GIVEN Admin A of league-a
- WHEN creating a match and selecting a court
- THEN all courts across all leagues are available

### Requirement: ensureScope via category chain

When editing a match, the system MUST verify that the match's `category.leagueId` matches the admin's `session.user.leagueId`.

#### Scenario: Cross-tenant match edit rejected

- GIVEN Admin A (league-a) and Match M belongs to league-b
- WHEN Admin A tries to edit Match M
- THEN `ensureScope()` checks Match → Category → League → leagueId
- AND the edit is rejected with "Access denied"

## MODIFIED Requirements

### Requirement: Match scheduling

The system MUST support creating match fixtures. The `categoryId` MUST belong to the admin's league. Courts remain global (not scoped).

(Previously: No league scoping on category/court selection.)

#### Scenario: Admin schedules a match (scoped)

- GIVEN an authenticated admin with `leagueId: league-a`, a category within league-a, 2 teams in that category, and an available court
- WHEN the admin creates a match with both teams, court, date, time, and round 1
- THEN the match is created with status `scheduled`
- AND the category belongs to league-a

#### Scenario: Cross-tenant category match rejected

- GIVEN Admin A (league-a)
- WHEN Admin A tries to create a match using a category from league-b
- THEN the server action rejects because the category is not in the admin's league

### Requirement: Court availability validation

No change — court conflicts are checked globally (courts are shared across leagues).
