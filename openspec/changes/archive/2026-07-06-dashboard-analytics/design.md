# Design: Dashboard Analytics

## Technical Approach

Server-side analytics module (`src/lib/analytics.ts`) with one Prisma aggregation function per chart, parallelizable via `Promise.all`. Each chart is a `"use client"` recharts component, dynamically imported with `ssr: false` to avoid hydration mismatch. Data flows server→client: the server renders async "section" components that fetch data and pass it as props to the dynamic chart wrappers. Per-chart Suspense for streaming, per-chart ErrorBoundary for resilience.

## Architecture Decisions

### Decision: Data fetching strategy

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Server Actions + client re-fetch | More network round-trips, caching complexity | ❌ |
| Async server components → props | One fetch per chart, streams independently, zero client data-fetching logic | ✅ |

Charts are pure renderers — they receive data as props. The only exception is FormTrendChart, which accepts a callback server action for category filtering.

### Decision: Raw SQL vs Prisma groupBy

| Query | Prisma groupBy | Raw SQL | Decision |
|-------|---------------|---------|----------|
| getMatchStatus | ✅ `db.match.groupBy()` | — | groupBy (simple, typed) |
| getGoalsDistribution | ❌ no `include` for team names | ✅ JOIN + GROUP BY | Raw SQL |
| getCardsBreakdown | ❌ needs pivot (yellow/red columns) | ✅ FILTER clause | Raw SQL |
| getFormTrend | ❌ needs conditional aggregation | ✅ FILTER clause | Raw SQL |
| getTopScorers | ❌ needs JOIN + LIMIT | ✅ JOIN + GROUP BY | Raw SQL |

### Decision: Error isolation per chart

Each chart renders inside `<ErrorBoundary>` within its `<Suspense>`. The `analytics.ts` functions are independent — `Promise.all` runs them all, catching per-function failures so one DB error doesn't crash the section.

## File Structure

```
src/
├── lib/
│   └── analytics.ts                          CREATE — 5 query functions
├── actions/
│   └── analytics.ts                          CREATE — server action for FormTrend filter
└── components/
    └── charts/
        ├── chart-card.tsx                    CREATE — <Card> wrapper + responsive container
        ├── goals-pie-chart.tsx               CREATE — PieChart (client)
        ├── match-status-chart.tsx            CREATE — donut PieChart (client)
        ├── cards-bar-chart.tsx               CREATE — stacked BarChart (client)
        ├── form-trend-chart.tsx              CREATE — LineChart + category <select> (client)
        ├── top-scorers.tsx                   CREATE — HTML table mini-list (client)
        ├── chart-skeleton.tsx                CREATE — skeleton matching chart dimensions
        └── index.ts                          CREATE — barrel export for dynamic imports

Modified:  src/app/(dashboard)/admin/page.tsx
```

## Component Tree

```
AdminDashboard (server, page)
└── <section className="grid gap-6 lg:grid-cols-[1fr_300px]">
    ├── <div className="grid gap-6 sm:grid-cols-2">       ← charts grid
    │   ├── <Suspense fallback={<ChartSkeleton />}>
    │   │   └── GoalsSection (async server fn)
    │   │       └── <ErrorBoundary>
    │   │           └── <GoalsPieChart data={...} />
    │   ├── <Suspense fallback={<ChartSkeleton />}>
    │   │   └── StatusSection (async server fn)
    │   │       └── <ErrorBoundary>
    │   │           └── <MatchStatusChart data={...} />
    │   ├── <Suspense fallback={<ChartSkeleton />}>
    │   │   └── CardsSection (async server fn)
    │   │       └── <ErrorBoundary>
    │   │           └── <CardsBarChart data={...} />
    │   └── <Suspense fallback={<ChartSkeleton />}>
    │       └── FormSection (async server fn)
    │           └── <ErrorBoundary>
    │               └── <FormTrendChart data={...} categories={...} />
    └── <Suspense fallback={<ChartSkeleton />}>
        └── TopScorersSection (async server fn)
            └── <ErrorBoundary>
                └── <TopScorers data={...} />
```

## Data Flow

```
AdminDashboard (server component)
  │
  ├── Promise.all([
  │     getGoalsDistribution(),
  │     getMatchStatus(),
  │     getCardsBreakdown(),
  │     getFormTrend(),
  │     getTopScorers(),
  │   ])
  │
  ├── GoalsSection──getGoalsDistribution()──→ GoalsPieChart props
  ├── StatusSection──getMatchStatus()───────→ MatchStatusChart props
  ├── CardsSection──getCardsBreakdown()─────→ CardsBarChart props
  ├── FormSection───getFormTrend()──────────→ FormTrendChart props
  │                                          └── category change → getFormTrendAction(catId)
  └── TopScorersSection──getTopScorers()────→ TopScorers props
```

Each section is an inline async function that fetches and renders. This gives per-chart Suspense streaming.

## Prisma Query Signatures

### `getGoalsDistribution(): Promise<{ teamName, goals, fill }[]>`

```sql
-- $queryRaw tagged template
SELECT t.name AS "teamName",
       COALESCE(t.color, '#6366f1') AS "fill",
       COUNT(g.id)::int AS goals
FROM goals g
JOIN matches m ON m.id = g.match_id AND m.status = 'FINISHED'
JOIN teams t ON t.id = g.team_id
GROUP BY t.id, t.name, t.color
ORDER BY goals DESC
```

### `getMatchStatus(): Promise<{ status: MatchStatus, count: number }[]>`

```ts
// Prisma groupBy (no raw needed)
db.match.groupBy({ by: ["status"], _count: { id: true } })
```

### `getCardsBreakdown(): Promise<{ teamName, yellows, reds }[]>`

```sql
-- $queryRaw tagged template
SELECT t.name AS "teamName",
       COUNT(c.id) FILTER (WHERE c.type = 'YELLOW')::int AS yellows,
       COUNT(c.id) FILTER (WHERE c.type = 'RED')::int AS reds
FROM cards c
JOIN teams t ON t.id = c.team_id
GROUP BY t.id, t.name
ORDER BY t.name
```

### `getFormTrend(categoryId?: string): Promise<{ round, wins, draws, losses }[]>`

```sql
-- $queryRaw, optional category filter via Prisma.sql / Prisma.empty
WITH latest AS (
  SELECT MAX(round) AS max_round FROM matches WHERE status = 'FINISHED'
)
SELECT m.round,
       COUNT(*) FILTER (WHERE m.local_score > m.visitor_score)::int AS wins,
       COUNT(*) FILTER (WHERE m.local_score = m.visitor_score)::int AS draws,
       COUNT(*) FILTER (WHERE m.local_score < m.visitor_score)::int AS losses
FROM matches m, latest l
WHERE m.status = 'FINISHED'
  AND m.round >= l.max_round - 9
  ${categoryId ? Prisma.sql`AND m.category_id = ${categoryId}::uuid` : Prisma.empty}
GROUP BY m.round
ORDER BY m.round ASC
```

### `getTopScorers(): Promise<{ playerName, teamName, goals }[]>`

```sql
-- $queryRaw tagged template
SELECT CONCAT(p.name, ' ', p.surname) AS "playerName",
       t.short_name AS "teamName",
       COUNT(g.id)::int AS goals
FROM goals g
JOIN matches m ON m.id = g.match_id AND m.status = 'FINISHED'
JOIN players p ON p.id = g.player_id
JOIN teams t ON t.id = g.team_id
GROUP BY p.id, p.name, p.surname, t.short_name
ORDER BY goals DESC
LIMIT 5
```

## Recharts Component Selection

| Visualization | Recharts Components | Variant |
|---------------|-------------------|---------|
| Goals Distribution | `<PieChart>` `<Pie>` `<Cell>` `<Tooltip>` `<Legend>` | Standard pie, team color fills |
| Match Status | `<PieChart>` `<Pie>` `<Cell>` `<Tooltip>` | Donut (`innerRadius=60`), center label with total count |
| Cards Breakdown | `<BarChart>` `<Bar>` `<XAxis>` `<YAxis>` `<Tooltip>` `<Legend>` | Stacked bars (`dataKey="yellows"` + `"reds"`), `barSize=32` |
| Form Trend | `<LineChart>` `<Line>` `<XAxis>` `<YAxis>` `<Tooltip>` `<Legend>` | 3 lines: wins (green), draws (amber), losses (red), dots, `ResponsiveContainer` |

## State Management

| State | Mechanism | Visual |
|-------|-----------|--------|
| Loading | `<Suspense fallback={<ChartSkeleton />}>` | Animated skeleton matching chart card dimensions (~h-[300px]) |
| Empty | Returned data is `[]` — chart component renders `<EmptyState>` | Icon + "Sin goles registrados" (per chart message) |
| Error | `<ErrorBoundary>` wrapping each dynamic chart | AlertTriangle + "Error al cargar {chart name}" + "Reintentar" button |
| Form filter | Client state (`useState` for selectedCategoryId) + server action on change | `<select>` dropdown above line chart |

## Interfaces / Contracts

```typescript
// src/lib/analytics.ts
export interface GoalsDistribution { teamName: string; goals: number; fill: string }
export interface MatchStatusRow    { status: MatchStatus; count: number }
export interface CardsBreakdown    { teamName: string; yellows: number; reds: number }
export interface FormTrendRow      { round: number; wins: number; draws: number; losses: number }
export interface TopScorerRow      { playerName: string; teamName: string; goals: number }

export async function getGoalsDistribution(): Promise<GoalsDistribution[]>
export async function getMatchStatus(): Promise<MatchStatusRow[]>
export async function getCardsBreakdown(): Promise<CardsBreakdown[]>
export async function getFormTrend(categoryId?: string): Promise<FormTrendRow[]>
export async function getTopScorers(): Promise<TopScorerRow[]>

// src/actions/analytics.ts
"use server"
export async function getFormTrendAction(categoryId: string | null): Promise<FormTrendRow[]>
export async function getCategories(): Promise<{ id: string; name: string }[]>
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Each analytics function | Seed DB with known data, assert returned shape and values |
| Integration | `Promise.all` parallel execution | Verify all 5 resolve without interference |
| Integration | Category filter in form trend | Call with and without `categoryId`, assert different results |
| E2E | Dashboard renders all charts | Playwright — assert canvas/svg elements exist, skeleton replaced |
| E2E | Error fallback visible | Mock DB failure, assert error card renders |

## Migration / Rollout

No migration required — all queries read existing tables, no schema changes. Additive UI only.

## Open Questions

- [ ] Confirm whether own goals (`isOwnGoal: true`) are included or excluded from GoalsDistribution and TopScorers queries
