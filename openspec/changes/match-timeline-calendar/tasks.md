# Tasks: Match Timeline & Calendar

## Phase 1 — Match Detail Page

### 1.1 Create match header component [x]
**File**: `src/components/public/match-header.tsx`
- Server component that receives match data with teams, score, status, category, court, date/time
- Renders: team badges (color dot + name + logo if available), score in large font (or "vs" for SCHEDULED), status badge, category/court/date/time metadata row
- `notFound()` call goes in the page, not in this component — this is a display-only component

### 1.2 Create match timeline component [x]
**File**: `src/components/public/match-timeline.tsx`
- Server component receiving flat arrays of `Goal & { player, team }` and `Card & { player, team }`, merged and sorted by minute
- Pure CSS vertical timeline: `<ul>` with `::before` for the line, `<li>` per event
- Goal events: green dot/check icon, "GOAL {player}" with team color indicator, minute, own goal badge
- Card events: yellow or red rectangle indicator, "2A" badge when `isSecondYellow && type === "RED"`
- Empty state: no events → show "Sin eventos" muted text

### 1.3 Create match stats component [x]
**File**: `src/components/public/match-stats.tsx`
- Server component receiving local/visitor scores and aggregated counts
- Renders two-column summary: goals per team (local X - visitor Y), yellow cards per team, red cards per team
- Compact, below the timeline

### 1.4 Create match detail page [x]
**File**: `src/app/(public)/matches/[id]/page.tsx`
- Server component with `params: Promise<{ id: string }>`
- Calls `db.match.findUnique` with full relations include (teams, category, court, goals with player+team, cards with player+team)
- `notFound()` when match is null
- Renders: `MatchHeader` → `MatchTimeline` (with goals + cards sorted by minute) → `MatchStats`
- Wraps each team name/link to `/teams/[id]`
- Sets `metadata.title` dynamically

## Phase 2 — Calendar View

### 2.1 Create calendar grid component [x]
**File**: `src/components/public/match-calendar-grid.tsx`
- Receives `matches` grouped by week
- Renders a table/grid layout: each row = one week, columns = days of the week (Mon–Sun)
- Each day cell shows match cards stacked vertically: time, local vs visitor shortName, score if FINISHED
- Empty day cells are muted/gray
- Day headers use `Intl.DateTimeFormat("es-AR", { weekday: "short" })`
- Week label on the left edge (e.g., "Semana 1" or date range)

### 2.2 Create calendar page [x]
**File**: `src/app/(public)/matches/calendar/page.tsx`
- Server component reading `searchParams.categoryId`
- Queries categories for filter, matches for the visible range with team selects
- Groups matches by week using server-side Date math
- Passes data to `CategorySelector` + `CalendarGrid`
- Empty state: same pattern as `matches/page.tsx` — dashed border, icon, contextual message

## Phase 3 — Integration

### 3.1 Link match cards on list page [x]
**File**: `src/app/(public)/matches/page.tsx`
- Wrap each match card `<div>` in `<Link href="/matches/${match.id}">`
- Keep all existing card content intact — just add the anchor wrapper
- Ensure keyboard accessibility (tabIndex, focus ring)

### 3.2 Add calendar toggle to matches page [x]
**File**: `src/app/(public)/matches/page.tsx`
- Add a segmented control / tabs row below the header: "Lista" | "Calendario"
- "Lista" is the current view (default), "Calendario" links to `/matches/calendar?categoryId=...` (preserving current filter)
- Use existing `Link` components, no client state needed

### 3.3 Add calendar route to navigation awareness [x]
**No file change needed** — the public layout already highlights parent `/matches` for any `/matches/*` child route (see `pathname.startsWith(link.href + "/")` in `layout.tsx`). Calendar page is automatically active.

## Phase 4 — Verify

### 4.1 Build check [x]
```bash
pnpm build
```
Verify no TypeScript errors, no missing exports, and the app compiles cleanly. Check that all new files are discoverable by Next.js route conventions.
