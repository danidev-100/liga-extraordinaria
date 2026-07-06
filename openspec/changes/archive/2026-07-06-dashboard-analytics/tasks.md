# Tasks: Dashboard Analytics

## Overview

Add 5 interactive recharts visualizations + a top-scorers mini-list to the admin dashboard. Server-side analytics module fetches all data via Prisma (groupBy + raw SQL). Each chart is a `"use client"` component dynamically imported with `ssr: false`, wrapped in Suspense + ErrorBoundary for independent streaming and error isolation.

**Stack:** Next.js 16 (App Router), Prisma 7 + PostgreSQL, recharts, shadcn/ui, Tailwind v4

---

## Execution Plan

### Legend

| Icon | Meaning |
|------|---------|
| ⬛ Foundation | No dependencies on other new files |
| ⬜ Standard | Depends on foundation tasks |
| 🔗 Integration | Depends on most/all standard tasks |

---

### Phase 0 — Foundation (parallel)

#### T1 ⬛ Analytics query module [x]

| Field | Value |
|-------|-------|
| **File** | `src/lib/analytics.ts` — CREATE |
| **Depends on** | Nothing (imports `db` from `@/lib/db`) |
| **Parallel hint** | Run alongside T3, T4 |

**What to implement:**

- 5 exported TypeScript interfaces: `GoalsDistribution`, `MatchStatusRow`, `CardsBreakdown`, `FormTrendRow`, `TopScorerRow`
- 5 exported async functions, each catching DB errors individually (never throw — return `[]` on failure for isolation):

| Function | Strategy | SQL |
|----------|----------|-----|
| `getGoalsDistribution()` → `GoalsDistribution[]` | `$queryRaw` | JOIN goals + matches (FINISHED) + teams, GROUP BY team, ordered DESC |
| `getMatchStatus()` → `MatchStatusRow[]` | `db.match.groupBy()` | groupBy `["status"]`, `_count: { id: true }` |
| `getCardsBreakdown()` → `CardsBreakdown[]` | `$queryRaw` | JOIN cards + teams, FILTER clauses for yellow/red columns |
| `getFormTrend(categoryId?)` → `FormTrendRow[]` | `$queryRaw` | CTE for max round, last 10 rounds, optional category filter via `Prisma.sql`/`Prisma.empty`, FILTER clauses for W/D/L |
| `getTopScorers()` → `TopScorerRow[]` | `$queryRaw` | JOIN goals + matches + players + teams, GROUP BY player, LIMIT 5 |

**Key details:**

- `getGoalsDistribution` excludes own goals (`WHERE g.is_own_goal = false`)
- `getMatchStatus` uses Prisma's Enum `MatchStatus` — import from `@prisma/client`
- `getFormTrend` wraps its categoryId filter in `Prisma.sql` when present, `Prisma.empty` when absent
- Each function wraps its query in try/catch and returns `[]` on error
- Also export a helper `OwnGoalFilter` decision type if needed downstream

---

#### T2 ⬛ Analytics server actions [x]

| Field | Value |
|-------|-------|
| **File** | `src/actions/analytics.ts` — CREATE |
| **Depends on** | T1 (imports `FormTrendRow` type) |
| **Parallel hint** | Run immediately after T1, parallel with T5–T9 |

**What to implement:**

- `"use server"` directive at top
- `getFormTrendAction(categoryId: string | null): Promise<FormTrendRow[]>` — calls `getFormTrend(categoryId ?? undefined)` from the analytics module
- `getCategories(): Promise<{ id: string; name: string }[]>` — `db.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })`
- Re-export `FormTrendRow` type so it can be imported from `@/actions/analytics` without crossing the server/client boundary wrong

---

#### T3 ⬛ ChartCard wrapper [x]

| Field | Value |
|-------|-------|
| **File** | `src/components/charts/chart-card.tsx` — CREATE |
| **Depends on** | Nothing (uses existing shadcn `Card` components) |
| **Parallel hint** | Run alongside T1, T4 |

**What to implement:**

A shared wrapper that renders a consistent `<Card>` around each chart:

```tsx
interface ChartCardProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}
```

- Uses `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` from `@/components/ui/card`
- CardContent wraps children in a `div` with `h-[300px]` and responsive width
- Accepts optional `description` prop for subtitle under title
- Optionally accepts a `headerExtra` slot for dropdowns/selects (used by FormTrendChart for the category filter)

---

#### T4 ⬛ ChartSkeleton component [x]

| Field | Value |
|-------|-------|
| **File** | `src/components/charts/chart-skeleton.tsx` — CREATE |
| **Depends on** | Nothing (uses existing `Skeleton` from `@/components/ui/skeleton`) |
| **Parallel hint** | Run alongside T1, T3 |

**What to implement:**

A skeleton placeholder matching the `ChartCard` dimensions for use as Suspense fallback:

```tsx
interface ChartSkeletonProps {
  hasHeader?: boolean  // default true — show title/description placeholders
}
```

- Renders a `<div className="rounded-xl border bg-card p-6 shadow-xs h-[300px]">`
- If `hasHeader`: Skeleton lines for title + description at top
- Bottom area: large Skeleton rect representing the chart area (e.g. circle for pie, bars for bar)
- Separately export `ChartSkeletonInline` for use in the admin page's dynamic import path

---

### Phase 1 — Chart Components (parallel with each other)

#### T5 ⬜ GoalsPieChart [x]

| Field | Value |
|-------|-------|
| **File** | `src/components/charts/goals-pie-chart.tsx` — CREATE |
| **Depends on** | T1 (types), T3 (ChartCard) |
| **Parallel hint** | Run alongside T6, T7, T9 |

**What to implement:**

`"use client"` component receiving `GoalsDistribution[]` as props.

- Import: `PieChart`, `Pie`, `Cell`, `Tooltip`, `Legend`, `ResponsiveContainer` from `recharts`
- Wraps content in `<ChartCard title="Goles por Equipo">`
- If `data.length === 0`: render `<EmptyState icon={Crosshair} title="Sin goles registrados" />`
- `Pie` with `dataKey="goals"`, `nameKey="teamName"`, `cx="50%"`, `cy="50%"`
- `Cell` per slice using `fill` from data (team color)
- Tooltip with custom formatter: `"${teamName}: ${goals} goles"`
- Legend positioned at bottom
- Wrapped in `ResponsiveContainer` width="100%" height="100%"

---

#### T6 ⬜ MatchStatusChart [x]

| Field | Value |
|-------|-------|
| **File** | `src/components/charts/match-status-chart.tsx` — CREATE |
| **Depends on** | T1 (types), T3 (ChartCard) |
| **Parallel hint** | Run alongside T5, T7, T9 |

**What to implement:**

`"use client"` component receiving `MatchStatusRow[]` as props.

- Import: `PieChart`, `Pie`, `Cell`, `Tooltip`, `ResponsiveContainer` from `recharts`
- Wraps in `<ChartCard title="Estado de Partidos">`
- Donut variant: `innerRadius={60}`, `outerRadius={100}`, `paddingAngle={2}`
- If `data.length === 0`: `<EmptyState icon={Calendar} title="Sin partidos registrados" />`
- Custom center label via recharts `Label` component showing total match count
- Color mapping: `SCHEDULED` → `#3b82f6` (blue), `PLAYING` → `#22c55e` (green), `FINISHED` → `#6b7280` (gray)
- Status label mapping: `"Programado"`, `"Jugando"`, `"Finalizado"`
- Tooltip shows Spanish status name + count

---

#### T7 ⬜ CardsBarChart [x]

| Field | Value |
|-------|-------|
| **File** | `src/components/charts/cards-bar-chart.tsx` — CREATE |
| **Depends on** | T1 (types), T3 (ChartCard) |
| **Parallel hint** | Run alongside T5, T6, T9 |

**What to implement:**

`"use client"` component receiving `CardsBreakdown[]` as props.

- Import: `BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`, `Legend`, `ResponsiveContainer` from `recharts`
- Wraps in `<ChartCard title="Tarjetas por Equipo">`
- If `data.length === 0`: `<EmptyState icon={ShieldAlert} title="Sin tarjetas registradas" />`
- Stacked bars: `<Bar dataKey="yellows" fill="#eab308" name="Amarillas" stackId="cards" />` + `<Bar dataKey="reds" fill="#ef4444" name="Rojas" stackId="cards" />`
- `barSize={32}`
- `XAxis dataKey="teamName"` with angled labels if many teams
- `YAxis` with integer tick count
- Tooltip shows "Amarillas: N, Rojas: M"
- Legend at bottom

---

#### T8 ⬜ FormTrendChart [x]

| Field | Value |
|-------|-------|
| **File** | `src/components/charts/form-trend-chart.tsx` — CREATE |
| **Depends on** | T1 (types), T2 (server action), T3 (ChartCard) |
| **Parallel hint** | Run after T2, alongside T5–T7, T9 |

**What to implement:**

`"use client"` component receiving `FormTrendRow[]` and `{ id: string; name: string }[]` (categories) as props.

- Import: `LineChart`, `Line`, `XAxis`, `YAxis`, `Tooltip`, `Legend`, `ResponsiveContainer`, `CartesianGrid` from `recharts`
- Wraps in `<ChartCard title="Tendencia de Forma">`
- If `data.length === 0`: `<EmptyState icon={TrendingDown} title="Sin datos de forma reciente" />`
- Three lines on same chart:
  - Wins: `dataKey="wins"` stroke `#22c55e` (green), `name="Victorias"`, `dot`
  - Draws: `dataKey="draws"` stroke `#eab308` (amber), `name="Empates"`, `dot`
  - Losses: `dataKey="losses"` stroke `#ef4444` (red), `name="Derrotas"`, `dot`
- `XAxis dataKey="round"` with label "Jornada"
- `CartesianGrid strokeDasharray="3 3"`
- Category filter dropdown using `<select>` or shadcn `<Select>` inside `ChartCard`'s `headerExtra` slot
  - `"Todas las categorías"` option at top (value `""`)
  - On change: calls `getFormTrendAction(categoryId)` via server action, updates local state
  - Use `useAction` or direct `fetch` approach — prefer `import { getFormTrendAction } from "@/actions/analytics"` and call it from the client component (Next.js server actions work from `"use client"`)

---

#### T9 ⬜ TopScorersList (mini-list) [x]

| Field | Value |
|-------|-------|
| **File** | `src/components/charts/top-scorers.tsx` — CREATE |
| **Depends on** | T1 (types), T3 (ChartCard) |
| **Parallel hint** | Run alongside T5, T6, T7 |

**What to implement:**

`"use client"` component receiving `TopScorerRow[]` as props. **No recharts** — plain HTML.

- Wraps in `<ChartCard title="Máximos Goleadores">`
- If `data.length === 0`: `<EmptyState icon={Crosshair} title="Sin goleadores aún" />`
- Renders an HTML `<table>` or shadcn `<Table>` with columns:
  - `#` (position, 1-indexed)
  - Jugador (full name)
  - Equipo (team short name)
  - G (goal count)
- Gold/silver/bronze styling for top 3 (medal emoji as data or via background color — keep it in CSS, not emoji)
- Golden boot icon or star next to the top scorer's row
- No pagination — always shows up to 5 rows

---

### Phase 2 — Integration

#### T10 🔗 Barrel export [x]

| Field | Value |
|-------|-------|
| **File** | `src/components/charts/index.ts` — CREATE |
| **Depends on** | T5, T6, T7, T8, T9 (all chart components must exist) |
| **Parallel hint** | Run after all chart components |

**What to implement:**

Barrel file with named exports for `next/dynamic` consumption in the admin page:

```ts
export { GoalsPieChart } from "./goals-pie-chart"
export { MatchStatusChart } from "./match-status-chart"
export { CardsBarChart } from "./cards-bar-chart"
export { FormTrendChart } from "./form-trend-chart"
export { TopScorers } from "./top-scorers"
export { ChartCard } from "./chart-card"
```

The admin page will import these via `next/dynamic(() => import("@/components/charts"), { ssr: false })` and destructure the named export.

---

#### T11 🔗 Admin dashboard composition [x]

| Field | Value |
|-------|-------|
| **File** | `src/app/(dashboard)/admin/page.tsx` — MODIFY |
| **Depends on** | T1 (analytics functions), T2 (formTrendAction + categories), T4 (ChartSkeleton), T10 (barrel export) |
| **Parallel hint** | Last task — run after T1, T2, T4, T10 |

**What to implement:**

Add a new analytics section **below** the existing "Quick Actions + Recent Matches" grid (line ~305, before the closing `</div>`).

1. **Dynamic imports** at top of file:

```ts
import dynamic from "next/dynamic"

const GoalsPieChart = dynamic(() => import("@/components/charts/goals-pie-chart").then(m => m.GoalsPieChart), { ssr: false })
const MatchStatusChart = dynamic(() => import("@/components/charts/match-status-chart").then(m => m.MatchStatusChart), { ssr: false })
const CardsBarChart = dynamic(() => import("@/components/charts/cards-bar-chart").then(m => m.CardsBarChart), { ssr: false })
const FormTrendChart = dynamic(() => import("@/components/charts/form-trend-chart").then(m => m.FormTrendChart), { ssr: false })
const TopScorers = dynamic(() => import("@/components/charts/top-scorers").then(m => m.TopScorers), { ssr: false })
```

2. **Data fetching** inside the server component — add to the existing `Promise.all` or create a separate one:

```ts
const [
  goalsData, statusData, cardsData, formTrendData, topScorersData, categories,
] = await Promise.all([
  getGoalsDistribution(),
  getMatchStatus(),
  getCardsBreakdown(),
  getFormTrend(),
  getTopScorers(),
  getCategories(),
])
```

3. **Analytics section** in the JSX:

```tsx
{/* Analytics Charts */}
<section className="grid gap-6 lg:grid-cols-[1fr_300px]">
  <div className="grid gap-6 sm:grid-cols-2">
    <Suspense fallback={<ChartSkeleton />}>
      <ErrorBoundary fallback={<ChartErrorFallback title="Goles por Equipo" />}>
        <GoalsPieChart data={goalsData} />
      </ErrorBoundary>
    </Suspense>
    <Suspense fallback={<ChartSkeleton />}>
      <ErrorBoundary fallback={<ChartErrorFallback title="Estado de Partidos" />}>
        <MatchStatusChart data={statusData} />
      </ErrorBoundary>
    </Suspense>
    <Suspense fallback={<ChartSkeleton />}>
      <ErrorBoundary fallback={<ChartErrorFallback title="Tarjetas por Equipo" />}>
        <CardsBarChart data={cardsData} />
      </ErrorBoundary>
    </Suspense>
    <Suspense fallback={<ChartSkeleton />}>
      <ErrorBoundary fallback={<ChartErrorFallback title="Tendencia de Forma" />}>
        <FormTrendChart data={formTrendData} categories={categories} />
      </ErrorBoundary>
    </Suspense>
  </div>
  <Suspense fallback={<ChartSkeleton />}>
    <ErrorBoundary fallback={<ChartErrorFallback title="Máximos Goleadores" />}>
      <TopScorers data={topScorersData} />
    </ErrorBoundary>
  </Suspense>
</section>
```

4. **ChartErrorFallback** — a simple client component or inline function that renders a card with "Error al cargar {title}" + "Reintentar" button. This is the `fallback` prop for `ErrorBoundary`. It can be placed in a new file `src/components/charts/error-fallback.tsx` or inline in the page. Since ErrorBoundary already has a default fallback with "Algo salió mal", using a custom one with the chart name is preferred.

5. **Import additions** at top of file: `getGoalsDistribution`, `getMatchStatus`, `getCardsBreakdown`, `getFormTrend`, `getTopScorers` from `@/lib/analytics`, `getCategories` from `@/actions/analytics`, `ErrorBoundary` from `@/components/ui/error-boundary`, `ChartSkeleton` from `@/components/charts/chart-skeleton`.

---

### Bonus (Optional)

#### T12 ⬛ Raw SQL reference files

| Field | Value |
|-------|-------|
| **File** | `openspec/changes/dashboard-analytics/db/` — CREATE folder with `.sql` files |
| **Depends on** | Nothing (documentation only) |
| **Parallel hint** | Any time |

**What to implement:**

- `db/01_goals_distribution.sql`
- `db/02_match_status.sql`
- `db/03_cards_breakdown.sql`
- `db/04_form_trend.sql`
- `db/05_top_scorers.sql`

Reference copies of the raw SQL queries for documentation/review purposes. Each file contains the SQL as it appears in `analytics.ts` with a header comment describing the function and expected return columns.

---

## Dependency Graph

```
Phase 0 (parallel)
├── T1 ─── analytics.ts ───────────────┐
├── T2 ─── actions/analytics.ts ───────┤─── depends on T1 types
├── T3 ─── chart-card.tsx ─────────────┤
└── T4 ─── chart-skeleton.tsx ─────────┘

Phase 1 (parallel with each other)
├── T5 ─── goals-pie-chart.tsx ──── depends on T1, T3
├── T6 ─── match-status-chart.tsx ─ depends on T1, T3
├── T7 ─── cards-bar-chart.tsx ──── depends on T1, T3
├── T8 ─── form-trend-chart.tsx ─── depends on T1, T2, T3
└── T9 ─── top-scorers.tsx ──────── depends on T1, T3

Phase 2 (sequential)
├── T10 ── barrel index.ts ──────── depends on T5–T9
└── T11 ── admin page.tsx ───────── depends on T1, T2, T4, T10
```

**Actual execution recommendation:**

| Pass | Tasks | Rationale |
|------|-------|-----------|
| Pass 1 | T1, T3, T4 | Foundation — T1 unblocks all charts, T3/T4 don't depend on anything |
| Pass 2 | T2, T5, T6, T7, T9 | T2 needs T1; chart components need T1+T3; all 5 can run in parallel |
| Pass 3 | T8 | Needs T2 (server action) — guaranteed done by now |
| Pass 4 | T10, T11 | Integration — needs all components and analytics functions |

---

## Artifact Store

Both stores must be updated:

| Store | Location |
|-------|----------|
| **OpenSpec** | `openspec/changes/dashboard-analytics/tasks.md` |
| **Engram** | topic_key: `sdd/dashboard-analytics/tasks`, scope: project |
