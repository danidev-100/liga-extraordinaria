# Proposal: Public Detail Pages

## Intent

Give users access to detailed team and player information by adding public profile pages, and connect existing standings/scorer/card tables to those pages via clickable links.

## Scope

### In Scope
- Team detail page (`/teams/[id]`): roster, match results, stats, top scorers
- Player profile page (`/players/[id]`): personal info, goal history, card history, stats
- Link team names in standings to team pages
- Link player names in goleadores/tarjetas to player pages
- Add "Equipos" nav item to public header

### Out of Scope
- Team logos or player photos on detail pages (follows model, minimal effort)
- Admin-side detail pages (admin has separate views)
- Per-match detail drill-down from team match list
- Search/filter or pagination on detail pages

## Capabilities

### New Capabilities
- `public-team-detail`: Public read-only team profile with roster, matches, stats, top scorers
- `public-player-profile`: Public read-only player profile with goal/card history and stats

### Modified Capabilities
None.

## Approach

1. Create `src/app/(public)/teams/[id]/page.tsx` — server component queries team with Prisma includes (players, matches with results, standings, goals grouped by player)
2. Create `src/app/(public)/players/[id]/page.tsx` — server component queries player + goal list + card list
3. Update `StandingEntry` interface and `standings-table.tsx` to include team ID; render name as `<Link>`
4. Update goleadores and tarjetas pages: render player names as `<Link href="/players/{id}">`
5. Add `/teams` link to `navLinks` in `(public)/layout.tsx`

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/(public)/teams/[id]/page.tsx` | New | Team detail server component |
| `src/app/(public)/players/[id]/page.tsx` | New | Player profile server component |
| `src/components/public/standings-table.tsx` | Modified | Team names become links; needs team `id` in data |
| `src/app/(public)/standings/page.tsx` | Modified | Include team `id` in Prisma query |
| `src/app/(public)/goleadores/page.tsx` | Modified | Player names become links |
| `src/app/(public)/tarjetas/page.tsx` | Modified | Player names become links |
| `src/app/(public)/layout.tsx` | Modified | Add "Equipos" nav link |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| N+1 queries on detail pages | Medium | Use Prisma `include` with relation selects; test query count |
| Missing data edge cases | Low | Handle nulls and empty states for matches/goals/cards gracefully |
| Deleted team/player returns 500 | Low | Call `notFound()` when entity is missing |

## Rollback Plan

Revert changes to the 4 modified files (layout, standings page, standings-table, goleadores, tarjetas) and delete the 2 new route directories. The app reverts to current behavior without detail pages.

## Dependencies

None.

## Success Criteria

- [ ] `/teams/[id]` renders roster, match results, team stats, and top scorers
- [ ] `/players/[id]` renders personal info, goal/card history, and stats summary
- [ ] Team names in standings link to `/teams/[id]`
- [ ] Player names in goleadores/tarjetas link to `/players/[id]`
- [ ] "Equipos" nav item visible and navigates correctly
- [ ] Empty states render for teams/players with no matches, goals, or cards
- [ ] App builds without type or lint errors
