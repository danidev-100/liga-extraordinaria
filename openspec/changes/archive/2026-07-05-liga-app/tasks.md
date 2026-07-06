# Tasks: liga-app

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Est. changed lines | ~2,800–3,500 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Chain strategy | stacked-to-main |

```
Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High
```

### Work Units

| Unit | PR | Base | Scope |
|------|----|------|-------|
| 1 | PR 1 | `main` | Foundation (scaffold, schema, shadcn, auth, middleware) |
| 2 | PR 2 | `main` | Admin CRUD (5 entities: league, category, team, player, court) |
| 3 | PR 3 | `main` | Matches + standings engine + cards |
| 4 | PR 4 | `main` | Public views + polish + tests |

## Phase 1: Foundation

- [x] 1.1 Scaffold: `pnpm create next-app` (TS, App Router, src dir)
- [x] 1.2 Install deps: prisma, next-auth@beta, bcryptjs, zod, RHF, @hookform/resolvers, @tanstack/react-table, lucide-react, recharts
- [x] 1.3 Create `prisma/schema.prisma` — 11 models + 3 enums
- [x] 1.4 `prisma migrate dev --name init`; `src/lib/db.ts` singleton
- [x] 1.5 `prisma/seed.ts` — admin + sample data
- [x] 1.6 Init shadcn/ui; add components (button, input, card, table, dialog, form, select, badge, avatar, dropdown-menu, sonner, separator)
- [x] 1.7 `src/lib/auth.ts` — Auth.js v5 Credentials provider
- [x] 1.8 `src/middleware.ts` — redirect `/admin/*` to `/login` if unauthenticated
- [x] 1.9 Root layout (SessionProvider) + home page + login page + dashboard layout

## Phase 2: Admin CRUD

- [x] 2.1 Dashboard layout + sidebar component
- [x] 2.2 Zod schemas for league, category, team, player, court
- [x] 2.3 Server Actions for league, category, team, player, court CRUD
- [x] 2.4 Reusable RHF form + per-entity form components
- [x] 2.5 Reusable TanStack Table (data-table.tsx)
- [x] 2.6 Admin pages: league, categories, teams, players, courts (list/new/[id])

## Phase 3: Matches + Standings + Cards

- [x] 3.1 Zod schema + Server Actions for Match (court avail, same-team guard)
- [x] 3.2 Match admin pages (list, new, [id] with score entry + status)
- [x] 3.3 `src/lib/standings.ts` — pure-function engine (3/1/0 pts, tiebreakers)
- [x] 3.4 Zod + Server Actions for Goal and Card; atomic `$transaction` on match finish (scores + goals + cards + standings)
- [x] 3.5 Combined match-result form (scores + per-player goals + cards)

## Phase 4: Public Views & Polish

- [x] 4.1 Public standings page (Server Component + TanStack Table)
- [x] 4.2 Public match schedule page (grouped by round)
- [x] 4.3 Login page with RHF + Zod form
- [x] 4.4 Dashboard home with stats overview
- [x] 4.5 Polish: loading skeletons, empty states, error boundaries, responsive

## Phase 5: Tests

- [x] 5.1 Standings unit tests: win/draw/loss, tiebreakers, zero matches, incomplete round
- [x] 5.2 Zod schema tests: valid passes, invalid rejects per schema
- [x] 5.3 Middleware tests: authed allowed, unauthed redirected to `/login`
