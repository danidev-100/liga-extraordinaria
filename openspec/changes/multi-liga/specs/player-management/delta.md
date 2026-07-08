# Delta for Player Management

## ADDED Requirements

### Requirement: Admin query scoping by league

All admin server actions for players MUST be scoped to the admin's league. Players are scoped through the `Team → Category → League` relationship chain.

#### Scenario: Admin sees own league players only

- GIVEN Admin A (league-a) and Admin B (league-b)
- WHEN Admin A queries players via `/admin/players`
- THEN only players on teams belonging to league-a are returned

#### Scenario: Team selector filtered by league

- GIVEN the player creation form has a team dropdown
- WHEN Admin A opens the dropdown
- THEN only teams in league-a's categories are listed

### Requirement: ensureScope via team chain

When editing a player, the system MUST verify that the player's `team.category.leagueId` matches the admin's `session.user.leagueId`.

#### Scenario: Cross-tenant player assignment rejected

- GIVEN Admin A (league-a) and Player P currently on a team in league-b
- WHEN Admin A tries to edit Player P
- THEN `ensureScope()` checks Player → Team → Category → League → leagueId
- AND the edit is rejected with "Access denied"

#### Scenario: Player reassignment within league

- GIVEN Admin A owns league-a with Team X and Team Y
- WHEN Admin A reassigns a player from Team X to Team Y
- THEN the move succeeds (both teams are in the admin's league)

### Requirement: DNI uniqueness

No change — DNI remains globally unique across all leagues.
