# Dashboard Analytics Specification

## Purpose

Add interactive recharts visualizations and a top scorers mini-list to the admin dashboard at `/admin`, rendering below the existing summary cards and quick-actions section.

## Requirements

### Requirement: Analytics Data Module

The system **MUST** provide a server-side module `src/lib/analytics.ts` with one exported async function per chart. All functions **MUST** execute Prisma aggregation queries (no in-memory aggregation) and be parallelizable via `Promise.all`.

#### Scenario: All queries resolve

- GIVEN the database has matches, goals, and cards
- WHEN `Promise.all([getGoalsDistribution(), getMatchStatus(), getCardsBreakdown(), getFormTrend(), getTopScorers()])` is called
- THEN each function returns its typed data shape
- THEN total DB round-trips = 1 per chart function

#### Scenario: Empty database

- GIVEN the database has zero rows in all tables
- WHEN any analytics function is called
- THEN it returns an empty array (not null, not throws)

### Requirement: Goals Distribution PieChart

The system **MUST** render a `GoalsPieChart` component: query `Goal` grouped by `teamId` across FINISHED matches, returning `{ teamName: string, goals: number, fill: string }[]`. Use recharts `<PieChart>` with `<Pie>`, `<Cell>`, `<Tooltip>`, `<Legend>`. Layout: 1/2 grid width, responsive container.

#### Scenario: Goals exist across teams

- GIVEN 3 teams have scored in finished matches
- WHEN the chart renders
- THEN each team appears as a pie slice sized proportionally to its goal count
- THEN tooltip shows "Equipo: N goles"

#### Scenario: No goals scored yet

- GIVEN no finished matches with goals
- WHEN the chart renders
- THEN the component shows empty state: "Sin goles registrados"

### Requirement: Match Status Overview PieChart

The system **MUST** render a `MatchStatusChart` component: `db.match.groupBy({ by: ["status"], _count: true })`, returning `{ status: MatchStatus, count: number }[]`. Use recharts `<PieChart>` with donut variant (`innerRadius`). Center label shows total match count.

#### Scenario: Matches in all three statuses

- GIVEN SCHEDULED, PLAYING, and FINISHED matches exist
- WHEN the chart renders
- THEN three segments appear with labels: Programado, Jugando, Finalizado
- THEN center label shows the sum

#### Scenario: Only one status has matches

- GIVEN all matches are SCHEDULED
- WHEN the chart renders
- THEN a single full-ring segment is shown
- THEN center label shows the correct count

### Requirement: Cards Breakdown BarChart

The system **MUST** render a `CardsBarChart` component: query `Card` grouped by `teamId` and `type`, returning `{ teamName: string, yellows: number, reds: number }[]`. Use recharts `<BarChart>` with stacked `<Bar>`s. Team names on X axis, card count on Y axis.

#### Scenario: Teams with mixed cards

- GIVEN teams have both yellow and red cards
- WHEN the chart renders
- THEN each team has a stacked bar (yellow segment + red segment)
- THEN tooltip shows desglose: "Amarillas: N, Rojas: M"

#### Scenario: Team with zero cards

- GIVEN a team has no cards
- WHEN the chart renders
- THEN the team appears with zero-height bar (label visible, no segment)

### Requirement: Form Trend LineChart

The system **MUST** render a `FormTrendChart` component: query last N rounds (default 10) computing wins/draws/losses per round from `Match` results (status=FINISHED). Returns `{ round: number, wins: number, draws: number, losses: number }[]`. The chart **MUST** be filterable by category via a `<select>` dropdown (category ID → filter matches by `categoryId`). Use recharts `<LineChart>` with three `<Line>` elements.

#### Scenario: Category filter selected

- GIVEN matches across two categories
- WHEN user selects a specific category in the dropdown
- THEN chart re-renders with data scoped to that category's matches

#### Scenario: No finished matches in selected rounds

- GIVEN no finished matches exist in the last 10 rounds for the selected category
- WHEN the chart renders
- THEN empty state: "Sin datos de forma reciente"

### Requirement: Top 5 Scorers Mini-List

The system **MUST** render a `TopScorers` component (plain HTML table, no recharts): query `Goal` grouped by `playerId`, ordered desc, limited to 5, including player name, team name, goal count. Returns `{ playerName: string, teamName: string, goals: number }[]`.

#### Scenario: Scorers exist

- GIVEN 5+ players have scored
- WHEN the list renders
- THEN exactly 5 rows shown ordered by goals descending
- THEN each row shows rank, full name, team abbreviation, goal count

#### Scenario: Fewer than 5 scorers

- GIVEN only 2 players have scored
- WHEN the list renders
- THEN only 2 rows are shown (no empty filler rows)

### Requirement: Dashboard Composition

The system **MUST** place the chart section **below** the "Quick Actions + Recent Matches" grid in `src/app/(dashboard)/admin/page.tsx`. Layout: 2-column grid on `lg+` (charts left, top scorers right), single column on mobile. All chart components **MUST** be client components (`"use client"`) imported dynamically with `next/dynamic` and `ssr: false`.

#### Scenario: Desktop viewport

- GIVEN viewport width >= 1024px
- WHEN the dashboard renders
- THEN charts occupy a 2-column grid below quick actions
- THEN GoalsPie and StatusChart share top row; CardsBar and FormTrend share bottom row
- THEN TopScorers sits in a sidebar or below the grid

#### Scenario: Mobile viewport

- GIVEN viewport width < 640px
- WHEN the dashboard renders
- THEN all charts stack vertically, full width

### Requirement: Loading State

While analytics data is being fetched, the system **MUST** display `<Skeleton>` cards matching each chart's dimensions. The system **SHOULD** use `React.Suspense` with a `fallback` per chart wrapper.

#### Scenario: Suspense boundary active

- GIVEN analytics queries take 2 seconds
- WHEN the dashboard page loads
- THEN skeleton cards render immediately in chart positions
- THEN skeletons are replaced by live charts once data resolves

### Requirement: Error Handling

Each chart **MUST** be wrapped in an `ErrorBoundary` that catches rendering errors. On error, display a card with an alert icon, "Error al cargar {chart name}" text, and a "Reintentar" button. The analytics module functions **MUST** catch DB errors individually so one chart failure does not block others.

#### Scenario: Single chart query fails

- GIVEN the goals query throws a DB error
- WHEN the dashboard renders
- THEN GoalsPieChart shows the error fallback card
- THEN all other charts render normally with their data

#### Scenario: All queries fail

- GIVEN the database is unreachable
- WHEN the dashboard renders
- THEN each chart shows its individual error fallback
- THEN the summary cards above still render from cached/earlier data or show their own errors unaffected
