# Design: Public Detail Pages

## Technical Approach

Two new server-component routes (`/teams/[id]`, `/players/[id]`) with direct Prisma queries, wrapping name cells in existing pages as `<Link>`s, and adding an "Equipos" nav item. All data fetched server-side — no new API routes or client state.

**Specs**: `public-team-detail` and `public-player-profile` define the data sections and empty states — the design maps each directly to a Prisma query + render section.

## Architecture Decisions

### Decision: Route placement

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `(public)/teams/[id]/page.tsx` | Follows existing public route structure; inherits nav/footer layout | **Chosen** |
| Root `/teams/[id]/page.tsx` | Would bypass public layout, requiring duplicate header | Rejected |

### Decision: Data fetching pattern

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Server component direct DB | Matches existing standings/goleadores/tarjetas pages; no client waterfalls | **Chosen** |
| API route + client fetch | Adds latency, needs loading states, inconsistent with existing codebase | Rejected |

### Decision: Top scorers query for team page

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `goal.groupBy` + `player.findMany` | Two queries; matches existing goleadores pattern; only transfers aggregated data | **Chosen** |
| Include goals in team query | Transfers every goal row client-side; more bytes over network | Rejected |

### Decision: Match results for team page

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Single `match.findMany` with `OR: [localTeamId, visitorTeamId]` | One query, naturally sorted; opponent inferred from which field matches | **Chosen** |
| Include `localMatches` + `visitorMatches` on team | Need manual merge + re-sort in component | Rejected |

### Decision: Standings link — add `id` to existing interface

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Add `id` to `team` select in `StandingEntry` | Minimal change; `standing-table.tsx` already client; just wrap in `next/link Link` | **Chosen** |
| Create new component | Over-engineered; existing table is clean | Rejected |

## Data Flow

```
Browser → Server Component → Prisma → PostgreSQL
                                   ↓
                              Render sections
                                   ↓
Browser ← HTML (streamed) ← Server Component
```

**Standings page flow** (modified):
```
standings/page.tsx (server)
  └─ db.standing.findMany({ include: { team: { select: { id, name, shortName, color } } })
       → StandingEntry now includes team.id
         └─ standings-table.tsx (client) renders <Link href="/teams/{id}"> for team name
```

**Goleadores/Tarjetas flow** (modified):
```
page.tsx already has playerId in ScorerEntry/CardEntry
  └─ Render <Link href="/players/{id}"> around player name cell
```

## Prisma Query Signatures

### Team page — primary query

```typescript
const team = await db.team.findUnique({
  where: { id },
  include: {
    category: { select: { name: true, league: { select: { name: true } } } },
    players: {
      where: { isActive: true },
      orderBy: [{ jerseyNumber: "asc" }, { surname: "asc" }],
      select: { id: true, name: true, surname: true, jerseyNumber: true },
    },
    standing: true, // nullable — handle with zeroes fallback
  },
})
if (!team) notFound()
```

### Team page — finished matches

```typescript
const matches = await db.match.findMany({
  where: {
    categoryId: team.categoryId,
    status: "FINISHED",
    OR: [{ localTeamId: id }, { visitorTeamId: id }],
  },
  include: {
    localTeam: { select: { id: true, name: true, shortName: true } },
    visitorTeam: { select: { id: true, name: true, shortName: true } },
  },
  orderBy: { date: "desc" },
})
```

### Team page — top 10 scorers

```typescript
const topScorersRaw = await db.goal.groupBy({
  by: ["playerId"],
  where: { teamId: id, match: { status: "FINISHED" }, isOwnGoal: false },
  _count: { id: true },
  orderBy: { _count: { id: "desc" } },
  take: 10,
})

const scorers = topScorersRaw.length
  ? await db.player.findMany({
      where: { id: { in: topScorersRaw.map((s) => s.playerId) } },
      select: { id: true, name: true, surname: true },
    })
  : []
```

### Player page — primary query

```typescript
const player = await db.player.findUnique({
  where: { id },
  include: {
    team: { select: { id: true, name: true, shortName: true, color: true } },
    goals: {
      where: { match: { status: "FINISHED" } },
      include: {
        match: {
          select: {
            date: true,
            localTeamId: true,
            visitorTeamId: true,
            localTeam: { select: { name: true, shortName: true } },
            visitorTeam: { select: { name: true, shortName: true } },
          },
        },
      },
      orderBy: { match: { date: "desc" } },
    },
    cards: {
      where: { match: { status: "FINISHED" } },
      include: {
        match: {
          select: {
            date: true,
            localTeamId: true,
            visitorTeamId: true,
            localTeam: { select: { name: true, shortName: true } },
            visitorTeam: { select: { name: true, shortName: true } },
          },
        },
      },
      orderBy: { match: { date: "desc" } },
    },
  },
})
if (!player) notFound()
```

**Opponent resolution**: `goal.match.localTeamId === player.teamId ? goal.match.visitorTeam : goal.match.localTeam`. Same for cards.

## Component Breakdown

### Team page (`/teams/[id]`)

| Section | Data Source | Notes |
|---------|------------|-------|
| Team header | `team.name`, `team.category.name` — `team.category.league.name` | Back-link to `/standings` |
| Roster | `team.players[]` | Active only, sorted # → surname; empty state "Sin jugadores activos" |
| Stats summary | `team.standing` (nullable) | 10 stat boxes (Pts, PJ, PG, PE, PP, GF, GC, DG, TA, TR); zeroes fallback |
| Match results | `matches[]` | Opponent + score + date + round; empty state "Sin partidos jugados" |
| Top scorers | `topScorersRaw` + `scorers` merged | Name + goals; empty state "Sin goles registrados" |

### Player page (`/players/[id]`)

| Section | Data Source | Notes |
|---------|------------|-------|
| Player header | `player.*`, `player.team` | Name, surname, #, team link, birth date |
| Stats summary | Computed from `player.goals`, `player.cards` | Total goals (excl. own), yellows, reds |
| Goal history | `player.goals[]` | Match date, opponent, minute, own-goal flag; empty state |
| Card history | `player.cards[]` | Match date, opponent, type, minute; empty state |

## Link Integration

| File | Change |
|------|--------|
| `standings/page.tsx` | Add `id: true` to `team` select in Prisma query |
| `standings-table.tsx` | Add `id: string` to `StandingEntry.team` type; wrap `row.team.shortName` / `row.team.name` in `<Link href={"/teams/" + row.team.id}>` with hover:underline |
| `goleadores/page.tsx` | Import `Link`; wrap `<TableCell className="font-medium">` content in `<Link href={"/players/" + scorer.playerId}>` |
| `tarjetas/page.tsx` | Import `Link`; wrap `<TableCell className="font-medium">` content in `<Link href={"/players/" + player.playerId}>` |

## Nav Update

Add to `navLinks` in `(public)/layout.tsx`:

```typescript
const navLinks = [
  { href: "/matches", label: "Partidos" },
  { href: "/standings", label: "Posiciones" },
  { href: "/goleadores", label: "Goleadores" },
  { href: "/tarjetas", label: "Tarjetas" },
  { href: "/standings", label: "Equipos" }, // ← new, points to standings
]
```

Note: "Equipos" targets `/standings` (no standalone teams index page exists); the active-route detection uses `pathname.startsWith(link.href + "/")` which won't falsely highlight since standings has no sub-routes.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/(public)/teams/[id]/page.tsx` | Create | Team detail server component |
| `src/app/(public)/players/[id]/page.tsx` | Create | Player profile server component |
| `src/app/(public)/standings/page.tsx` | Modify | Include `team.id` in Prisma `select` |
| `src/components/public/standings-table.tsx` | Modify | Add `id` to `StandingEntry.team`; render `<Link>` |
| `src/app/(public)/goleadores/page.tsx` | Modify | Wrap player name in `<Link>` |
| `src/app/(public)/tarjetas/page.tsx` | Modify | Wrap player name in `<Link>` |
| `src/app/(public)/layout.tsx` | Modify | Add "Equipos" nav link |

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Build | TypeScript + lint | `pnpm build` — catches type errors in new interfaces and Link usage |
| Visual | Empty states | Manual check: team with no players, no matches, no goals; player with no goals, no cards |
| Visual | 404 behavior | Navigate to `/teams/nonexistent`, `/players/nonexistent` |
| Visual | Link navigation | Click team names in standings, player names in goleadores/tarjetas |

## Migration / Rollout

No migration required. Existing data works as-is — `id` fields already exist in the database.

## Open Questions

- None.
