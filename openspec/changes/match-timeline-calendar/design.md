# Design: Match Timeline & Calendar

## Technical Approach

Two new public routes under `(public)/matches/` — a detail page at `[id]/page.tsx` and a calendar view at `calendar/page.tsx`. Both are server components with direct Prisma queries, matching the existing pattern in `matches/page.tsx`. The timeline is pure CSS (no library); the calendar uses a server-side week-grouping pass.

## Architecture Decisions

### Decision: Vertical timeline = CSS only, no library

| Option | Tradeoff |
|--------|----------|
| Timeline library (react-vertical-timeline, etc.) | Bundle bloat for a 2-state visual (line + dot) |
| CSS `::before` on a list | Zero JS, 30 lines of CSS, consistent with existing Tailwind pattern |

**Chosen**: CSS. A `<ul>` with `::before` for the vertical line, `<li>` per event with colored dots. The existing `cn()` helper handles conditional classes.

### Decision: Calendar grid = server-component date math

| Option | Tradeoff |
|--------|----------|
| Client date lib (date-fns, dayjs) | Extra dep for `startOfWeek`/`addDays` |
| `Intl.DateTimeFormat` + math | Already available, `Intl` is native |

**Chosen**: Native `Intl.DateTimeFormat` for weekday labels and locale formatting. Week bounds calculated from `Date` UTC math. Category filter uses the same `searchParams` pattern as the existing `matches/page.tsx`.

### Decision: Goals/cards in detail query = full relations, no N+1

The Prisma query includes `goals` (with `player`, `team`) and `cards` (with `player`, `team`), all ordered by minute. This mirrors the exact include shape already used in `matches/page.tsx` — confirming the pattern is proven.

### Decision: Calendar filter follows existing category pattern

Same `searchParams.categoryId` + `CategorySelector` pattern used by standings, goleadores, and tarjetas pages. No new filter UI needed.

## Data Flow

```
URL: /matches/[id]
  └→ matchDetailPage (server)
       ├─ db.match.findUnique(id, include goals/cards/teams/category/court)
       ├─ 404 if null → notFound()
       └─ renders MatchHeader + MatchTimeline + MatchStats

URL: /matches/calendar?categoryId=xxx
  └→ calendarPage (server)
       ├─ db.category.findMany()
       ├─ db.match.findMany(where categoryId, include teams/scores)
       ├─ group by week (server-side Date math)
       └─ renders CategorySelector + CalendarGrid
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/(public)/matches/[id]/page.tsx` | Create | Server component: match detail with timeline |
| `src/app/(public)/matches/calendar/page.tsx` | Create | Server component: calendar grid view |
| `src/components/public/match-timeline.tsx` | Create | Reusable vertical timeline component |
| `src/components/public/match-calendar-grid.tsx` | Create | Reusable calendar grid + day cells |
| `src/components/public/match-header.tsx` | Create | Match header (teams, score, metadata) |
| `src/components/public/match-stats.tsx` | Create | Stats summary (goals/cards per team) |
| `src/app/(public)/matches/page.tsx` | Modify | Wrap cards in `<Link href="/matches/{id}">`, add calendar toggle |

## Interfaces / Contracts

### Prisma Query (match detail)

```typescript
// shape — matches/page.tsx uses the same include
const matchQuery = {
  include: {
    category: true,
    court: true,
    localTeam: { select: { id: true, name: true, shortName: true, color: true, logoUrl: true } },
    visitorTeam: { select: { id: true, name: true, shortName: true, color: true, logoUrl: true } },
    goals: {
      include: { player: { select: { name: true, surname: true } }, team: { select: { id: true, name: true, shortName: true } } },
      orderBy: { minute: "asc" as const },
    },
    cards: {
      include: { player: { select: { name: true, surname: true } }, team: { select: { id: true, name: true, shortName: true } } },
      orderBy: { minute: "asc" as const },
    },
  },
}
```

### Calendar week structure

```typescript
interface CalendarWeek {
  label: string        // "1 - 7 Jul"
  start: Date
  end: Date
  matches: (Match & { localTeam: TeamBrief; visitorTeam: TeamBrief })[]
}
```

## Testing Strategy

No test infrastructure detected (openspec config: `strict_tdd: false`). Relies on build check (`pnpm build`).

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Build | TypeScript + Next.js compilation | `pnpm build` — verify no errors |
| Visual | Timeline, calendar grid | Manual review in browser |
| Edge cases | Missing goals/cards, empty calendar, 404 match | Browser check |

## Migration / Rollout

No migration required. New routes coexist with existing pages; old match list page retains all current cards, now wrapped in `<Link>`.

## Open Questions

None.
