# Tasks: Multi-Liga (Multi-Tenant League Support)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~900-1200 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Foundation) → PR 2 (Admin Scoping) → PR 3 (Public + Registration) → PR 4 (SUPER_ADMIN + Tests) |
| Chain strategy | stacked-to-main |
| Delivery strategy | ask-on-risk |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Schema, migration, auth, middleware, ensureScope | PR 1 | Safe foundation with no visible UI change. Tests included. |
| 2 | Action scoping (9 files), analytics scoping, sidebar league display | PR 2 | Admin isolation working. No registration flow yet. |
| 3 | `/register`, `/create-league`, `/liga/[slug]/*`, homepage, old redirects | PR 3 | Full E2E usable. Requires PR 1 + PR 2. |
| 4 | SUPER_ADMIN switcher, league override, integration/E2E tests | PR 4 | Polish, cross-tenant security tests. Requires PR 3. |

## Phase 1: Schema & Auth Foundation

- [x] 1.1 `prisma/schema.prisma` — add `slug` (unique) to League, `leagueId` (nullable) to Admin with FK, cascade deletes (Category→League, Team→Category, Player→Team)
- [x] 1.2 Run `npx prisma migrate dev --name add_multi_tenant` — generate migration; verify rollback script exists
- [x] 1.3 `prisma/seed.ts` — assign existing admin to demo league, add slug to demo league
- [x] 1.4 Create `scripts/backfill-slug.ts` — generate slug for existing leagues from name, assign existing ADMINS to first league, SUPER_ADMIN stays null
- [x] 1.5 `src/types/next-auth.d.ts` — add `leagueId: string | null` to Session.user, User, JWT
- [x] 1.6 `src/lib/auth.ts` — read `leagueId` in `authorize()`, include in JWT + session callbacks
- [x] 1.7 `src/lib/auth.config.ts` — add `/liga/:path*`, `/register`, `/create-league` to matcher
- [x] 1.8 `src/lib/ensure-scope.ts` (new) — `ensureScope(session, leagueId)` throws unless SUPER_ADMIN or matching leagueId
- [x] 1.9 `src/middleware.ts` — extract slug from `/liga/[slug]/` paths, resolve leagueId via DB, attach to request; redirect `/admin` visitors without leagueId to `/create-league`
- [ ] 1.10 Unit tests: `generateSlug()` (collision, accents, edge cases), `ensureScope()` (cross-tenant reject, SUPER_ADMIN bypass)

## Phase 2: Admin Scoping

- [x] 2.1 `src/actions/league.ts` — add slug generation to `createLeague`, stop singleton deactivation in `toggleLeagueActive`, scope queries by leagueId
- [x] 2.2 `src/actions/category.ts` — inject session leagueId in create, filter all queries by leagueId, add ensureScope to update/delete
- [x] 2.3 `src/actions/team.ts` — scope queries by leagueId via category join, filter category dropdown, add ensureScope on team edit
- [x] 2.4 `src/actions/player.ts` — scope queries by leagueId via team→category join, filter team dropdown, add ensureScope on player edit
- [x] 2.5 `src/actions/matches.ts` — scope queries by leagueId via category, filter categories/teams dropdowns, courts stay global
- [x] 2.6 `src/actions/match-result.ts` — scope queries by leagueId, add ensureScope
- [x] 2.7 `src/actions/standings.ts` — scope recalculation trigger by leagueId, add ensureScope
- [x] 2.8 `src/actions/court.ts` — no change needed (global), add comment noting intentional
- [x] 2.9 `src/actions/analytics.ts` — scope by leagueId
- [x] 2.10 `src/lib/analytics.ts` — add optional `leagueId: string` param to all 5 queries, add JOIN chain through `teams → categories → leagues` for `$queryRaw` filters
- [x] 2.11 `src/app/(dashboard)/admin/ligas/[slug]/page.tsx` — scope dashboard data to leagueId
- [x] 2.12 `src/app/(dashboard)/layout.tsx` — pass session user (role, leagueId, slug) to sidebar
- [x] 2.13 `src/components/layout/sidebar.tsx` — accept `leagueSlug`, generate `/admin/ligas/[slug]/...` links, display league name

## Phase 3: Public Pages & Registration Flow

- [x] 3.1 `src/app/(auth)/register/page.tsx` (new) — registration form: name, email, password, confirm password
- [x] 3.2 `src/actions/auth.ts` (new) — `register()` server action: validate input, hash password, create Admin with role=ADMIN and leagueId=null, auto-sign-in via `signIn("credentials")`
- [x] 3.3 `src/app/(auth)/create-league/page.tsx` (new) — league creation form: name, season, slug (auto-generated+editable), dates
- [x] 3.4 Update `createLeague` to set creator's `leagueId` after creation; redirect to `/admin`
- [x] 3.5 `src/app/(public)/liga/[slug]/layout.tsx` (new) — resolve slug to leagueId, 404 on miss, pass context to children
- [x] 3.6 Move public pages to `/liga/[slug]/`: standings, matches, teams, players, goleadores, tarjetas pages (6 files) — read slug from params, scope queries
- [x] 3.7 `src/app/(public)/layout.tsx` — nav links point to `/liga/[slug]/...`, resolve slug from params or redirect to `/`
- [x] 3.8 `src/app/page.tsx` — show league directory with links to `/liga/[slug]/standings`, "Create your league" CTA, scoped stats
- [x] 3.9 Old URL redirects: `/standings`, `/matches`, `/goleadores`, `/tarjetas`, `/teams`, `/players` → 301 redirect to `/liga/[slug]/...` or show picker
- [x] 3.10 `src/app/(auth)/login/page.tsx` — add "Create your league" link

## Phase 4: SUPER_ADMIN & Testing

- [ ] 4.1 `src/components/ui/league-switcher.tsx` (new) — dropdown list of all leagues, navigates to `/admin/ligas/[slug]/dashboard`, visible only for SUPER_ADMIN
- [ ] 4.2 Wire SUPER_ADMIN bypass in `ensureScope` and all action files — `role === SUPER_ADMIN` skips leagueId check
- [ ] 4.3 Handle SUPER_ADMIN league override via cookie/query param for unrestricted queries
- [ ] 4.4 Integration tests: admin from league A cannot r/w league B data (category, team, match, player)
- [ ] 4.5 Integration tests: analytics scoping — raw SQL with leagueId returns correct data
- [ ] 4.6 E2E test: registration → create league → scoped dashboard → SUPER_ADMIN switcher
- [ ] 4.7 Verify migration rollback script (drop slug, leagueId columns, revert cascade changes)

## Risk Assessment

| Task | Risk | Mitigation |
|------|------|-----------|
| 1.1 Cascade delete change | Data loss on league delete | Wrap in transaction, confirm dialog in UI |
| 2.2-2.9 Action scoping | Missing a query scope = data leak | ensureScope in every mutating action |
| 2.10 Analytics JOINs | Wrong JOIN produces wrong data | Test with 2 leagues, verify isolation |
| 3.6 Public page move | SEO breakage | 301 redirects from old URLs |
| 4.2 SUPER_ADMIN bypass | Forgetting bypass in an action = SUPER_ADMIN restricted | Ensure every ensureScope call checks role first |
