# Tasks: Public Detail Pages

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~220–280 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Phase 1: New Detail Pages

- [x] **1.1** Create `src/app/(public)/teams/[id]/page.tsx` — server component fetching team + category + league + active players + standing + finished matches + top 10 scorers. Call `notFound()` on missing team. Render sections: team header (breadcrumb to standings), stats summary (10-field card grid, zero-fallback), roster table (jersey #, name, surname; empty state), match results (opponent, score, date, round; empty state), top scorers table (name, goals; empty state). Opponent inferred from `localTeamId`/`visitorTeamId`.
- [x] **1.2** Create `src/app/(public)/players/[id]/page.tsx` — server component fetching player + team + goals + cards (finished matches only). Call `notFound()` on missing player. Render: player header (name, surname, jersey #, team link → `/teams/{id}`, birth date), stats summary (goals excl. own goals, yellows, reds), goal history table (date, opponent, minute, own-goal flag; empty state), card history table (date, opponent, type with badge, minute; empty state). Opponent resolution: `goal.match.localTeamId === player.teamId ? visitorTeam : localTeam`.

## Phase 2: Navigation & Link Integration

- [x] **2.1** Modify `src/app/(public)/standings/page.tsx` — add `id: true` to the `team` select in the Prisma `findMany` query.
- [x] **2.2** Modify `src/components/public/standings-table.tsx` — add `id: string` to `StandingEntry.team` type. Import `Link` from `next/link`. Wrap team name (`row.team.shortName`) in `<Link href={"/teams/" + row.team.id}>` with `hover:underline`.
- [x] **2.3** Modify `src/app/(public)/goleadores/page.tsx` — import `Link`. Wrap the player name cell (`{scorer.playerName} {scorer.playerSurname}`) in `<Link href={"/players/" + scorer.playerId}>`.
- [x] **2.4** Modify `src/app/(public)/tarjetas/page.tsx` — import `Link`. Wrap the player name cell (`{player.playerName} {player.playerSurname}`) in `<Link href={"/players/" + player.playerId}>`.
- [x] **2.5** Modify `src/app/(public)/layout.tsx` — add `{ href: "/standings", label: "Equipos" }` to the `navLinks` array.

## Phase 3: Verification

- [x] **3.1** Run `pnpm build` — verify zero type/lint errors across all changed files.
- [ ] **3.2** Visual check: navigate to `/teams/[valid-id]` — verify roster, matches, stats, scorers sections render with correct data.
- [ ] **3.3** Visual check: navigate to `/teams/[invalid-id]` — verify 404 page renders.
- [ ] **3.4** Visual check: navigate to `/players/[valid-id]` — verify bio, goals, cards, stats render correctly.
- [ ] **3.5** Visual check: navigate to `/players/[invalid-id]` — verify 404 page renders.
- [ ] **3.6** Visual check: click team names in standings → navigate to correct team page.
- [ ] **3.7** Visual check: click player names in goleadores/tarjetas → navigate to correct player page.
- [ ] **3.8** Visual check: "Equipos" nav link visible and navigates to `/standings`.
- [ ] **3.9** Empty states: verify "Sin jugadores activos", "Sin partidos jugados", "Sin goles registrados", "Sin tarjetas" appear when data is absent.
