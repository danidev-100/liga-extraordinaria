# Delta for Dashboard Analytics

## MODIFIED Requirements

### Requirement: Analytics Data Module

The system **MUST** provide a server-side module `src/lib/analytics.ts` with one exported async function per chart. All functions **MUST** accept an optional `leagueId` parameter and filter queries when provided. All functions **MUST** be parallelizable via `Promise.all`.

(Previously: No `leagueId` parameter. Queries returned global data.)

#### Scenario: All queries scoped to league

- GIVEN the database has matches, goals, and cards across League A and League B
- WHEN `Promise.all([getGoalsDistribution(leagueA), getMatchStatus(leagueA), ...])` is called
- THEN each function returns data scoped to League A only

#### Scenario: Queries without leagueId return all

- GIVEN a `SUPER_ADMIN` calls analytics functions without `leagueId`
- WHEN the functions execute
- THEN they return data across ALL leagues (aggregate)

#### Scenario: Empty database for a league

- GIVEN League A has zero rows in all tables
- WHEN `getGoalsDistribution(leagueA)` is called
- THEN it returns an empty array (not null, not throws)

### Requirement: Goals Distribution PieChart

The system **MUST** render a `GoalsPieChart` component: query `Goal` grouped by `teamId` across FINISHED matches, scoped by `leagueId` when provided. (Rest of behavior unchanged.)

(Previously: No league scoping. Queried all goals globally.)

#### Scenario: Goals scoped per league

- GIVEN 3 teams have scored in League A, 2 teams in League B
- WHEN the chart renders for League A
- THEN only the 3 teams from League A appear as pie slices

### Requirement: Match Status Overview PieChart

Same as Goals Distribution — `leagueId` filter added. (No behavior change otherwise.)

### Requirement: Cards Breakdown BarChart

Same as Goals Distribution — `leagueId` filter added. (No behavior change otherwise.)

### Requirement: Form Trend LineChart

The system **MUST** render a `FormTrendChart` component: query last N rounds (default 10) computing wins/draws/losses per round from `Match` results (status=FINISHED), scoped by optional `leagueId`. The chart **MAY** also accept an optional `leagueId` via the category dropdown.

(Previously: No league scoping.)

### Requirement: Top 5 Scorers Mini-List

The system **MUST** render a `TopScorers` component: query `Goal` grouped by `playerId`, ordered desc, limited to 5, scoped by optional `leagueId`.

(Previously: No league scoping.)

### Requirement: Error Handling

Unchanged. Error boundaries and per-function error catching apply identically. One league's failure does not block another league's data.
