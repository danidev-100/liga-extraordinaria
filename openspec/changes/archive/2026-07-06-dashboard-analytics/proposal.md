# Proposal: Dashboard Analytics

## Intent

The admin dashboard at `/admin` shows purely numerical summary cards with no visual data exploration. Adding interactive charts and a top scorers mini-list will give the admin at-a-glance insights into goals distribution, match status, discipline, and form — reducing context-switching to separate management pages.

## Scope

### In Scope
- Goals distribution PieChart (goals per team across finished matches)
- Match status overview PieChart/BarChart (SCHEDULED vs PLAYING vs FINISHED counts)
- Cards breakdown BarChart (yellow vs red cards per team)
- Top 5 scorers mini-list integrated into dashboard
- Form trend line (wins/draws/losses over recent rounds, filterable by category)
- All charts rendered below existing summary cards using recharts

### Out of Scope
- Export/download chart data (CSV, PNG)
- Drill-down click from charts to detail pages
- Historical season-over-season comparisons
- Real-time chart updates (requires polling/WebSockets)
- Public-facing analytics (admin-only)

## Capabilities

### New Capabilities
- `dashboard-analytics`: Interactive charts and top-scorers mini-list on the admin dashboard

### Modified Capabilities
None — no existing specs change behavior; charts are additive UI in the dashboard.

## Approach

Extract Prisma aggregation queries into a dedicated `src/lib/analytics.ts` module (parallelizable via `Promise.all`). Build client components per chart using recharts (`PieChart`, `BarChart`, `LineChart`) inside `src/components/charts/`. Compose them into a server component section below the existing dashboard grid. Keep chart queries efficient — aggregate at DB level, not in-memory.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/(dashboard)/admin/page.tsx` | Modified | Add chart section below summary cards |
| `src/lib/analytics.ts` | New | Prisma aggregation queries for chart data |
| `src/components/charts/` | New | Recharts client components (GoalsPie, StatusChart, CardsBar, FormTrend) |
| `src/components/dashboard/top-scorers.tsx` | New | Top 5 scorers mini-list component |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Recharts SSR incompatibility with Next.js | Low | Wrap all chart components in `"use client"` + dynamic import with `ssr: false` |
| Large dataset slows dashboard | Low | Aggregate at DB level; limit top scorers to 5; paginate form trend |

## Rollback Plan

Revert `src/app/(dashboard)/admin/page.tsx` to remove chart section. Delete `src/lib/analytics.ts` and `src/components/charts/`. No schema changes — fully reversible.

## Dependencies

- recharts (already installed — no package change needed)
- No schema migrations required (all queries read existing tables)

## Success Criteria

- [ ] All 4 charts render correctly with live data under the summary cards
- [ ] Top 5 scorers mini-list shows correct aggregate data across all finished matches
- [ ] Form trend responds to category filter selection
- [ ] `pnpm build` passes with no TS or lint errors
- [ ] Dashboard load time increases by less than 500ms (aggregated queries)
