# Proposal: Multi-Liga (Multi-Tenant League Support)

## Intent

### Business Problem

The app today assumes ONE league owner — a single admin managing a single set of categories, teams, matches, and standings. This makes the product unsellable as a SaaS: every new league requires a separate deployment, separate database, separate domain. There is no way for an independent league organizer to sign up, create their own league, and manage it without sharing data with strangers.

### PRD / Why Now

- **Market fit**: The #1 feature request for league management tools is "can I run my own league?" — not "can I see multiple leagues in one place."
- **Revenue**: Multi-tenant is the precondition for any tiered pricing (free single-league, paid multi-category, etc.).
- **Data integrity**: Without tenant isolation, two leagues' data is separated only by convention (the `leagueId` FK). A bug in a query accidentally omitting the filter leaks data across tenants.
- **User demand**: Existing seed data represents a demo league. Real users need their OWN league — with their own name, their own teams, their own rules.

---

## Target Users & Their Needs

| Persona | Goal | Pain Point Today |
|---------|------|------------------|
| **League Owner** (new) | Sign up, create their league, invite teams | Cannot. Must contact the developer to deploy a new instance. |
| **League Admin** (existing `ADMIN` role) | Manage their league's data only | Sees ALL leagues' data in dropdowns. No isolation. |
| **SUPER_ADMIN** (platform operator) | See ALL leagues, troubleshoot | Works, but no league context in dashboards. |
| **Public visitor** | View standings/matches for a specific league | Can filter by league via URL param, but URL has no league identity. Bookmarking `/standings?leagueId=X` is fragile. |

---

## Business Rules

1. **League ownership**: Every league SHALL have exactly one ADMIN owner. The owner is the user who created it.
2. **Tenant isolation**: An ADMIN MUST only see/manage data belonging to their own league. Queries that omit league scoping MUST be considered bugs.
3. **SUPER_ADMIN bypass**: SUPER_ADMIN SHALL see ALL leagues and ALL data across tenants. This is the operational/admin account.
4. **League creation**: Any authenticated user SHALL be able to create a new league. The creator becomes the ADMIN of that league.
5. **League slug**: Each league SHALL have a unique URL-friendly `slug` derived from its name, editable on creation.
6. **Data scope**: `Court` is an exception — courts are global (shared across leagues within a deployment) since they represent physical locations. All other entities (Category → Team → Player → Match → Standing → Goal → Card) are scoped to a league via their relationship chain.
7. **Active league**: The singleton "active league" concept MUST be replaced by league-scoped active status (a league is active for its tenant; multiple leagues can be active simultaneously).
8. **Deletion**: Deleting a league SHALL cascade-delete all its scoped data (categories, teams, players, matches, standings, goals, cards). Courts SHALL NOT be deleted.

---

## Product Outcome

After this change:
1. A new user lands on the home page and can **"Create your league"** — sign up, name their league, get a URL like `/liga/mi-liga-2026/standings`.
2. Admin dashboard is scoped: when logged in, the admin sees ONLY their league's data. The sidebar shows their league name.
3. Public pages are per-league: `/liga/[slug]/standings`, `/liga/[slug]/matches`, etc. Each league has its own public face.
4. SUPER_ADMIN has a league switcher and can impersonate/view any league.
5. The existing seed becomes the "demo" league, referenced by a default admin account.

---

## Current-State Gap Analysis

| Area | Current State | Gap |
|------|--------------|-----|
| **Auth (Admin model)** | `Admin` has `role` (ADMIN / SUPER_ADMIN). No league association. | ADMIN cannot be scoped to a league. A user cannot self-register. |
| **League model** | Has `name`, `season`, `dates`, `isActive`. No `slug`. | No URL-friendly identifier. `isActive` is a deployment-wide singleton. |
| **Routing — Admin** | `/admin/categories`, `/admin/teams`, etc. — flat. | No league context in URL. Two admins of different leagues share the same URL. |
| **Routing — Public** | `/standings`, `/matches`, etc. — flat. League filter uses `?leagueId=` query param. | URLs have no league identity. Deep-linking a specific league is fragile. |
| **Server actions** | `ensureAuth()` checks auth but not league ownership. Queries return ALL data. | ADMIN from league A can read/write league B's data. Only auth, not authorization. |
| **Public queries** | `db.team.findMany()`, `db.match.findMany()` — no league filter. | Homepage stats count ALL leagues' teams/players/matches together. |
| **Analytics (raw SQL)** | `getGoalsDistribution()`, `getCardsBreakdown()`, etc. — no league filter. | Charts aggregate across ALL leagues. Wrong for a tenant-specific dashboard. |
| **Sidebar** | Hardcoded nav to `/admin/*`. Shows generic "Liga Deportiva". | Cannot show league name or scope-aware navigation. |
| **Seed** | Creates one league with one admin. | No demo league concept. Single admin has no league association. |
| **Login page** | Email + password for admin only. | No self-registration. No "create league" CTA. |

---

## Scope

### In Scope (First Slice)

1. **Schema changes**: Add `slug` to League, add `leagueId` (nullable) to Admin, add cascade deletes, drop singleton `isActive` logic.
2. **Auth + registration**: Public registration page (name, email, password). On first creation → becomes ADMIN of a new league. Login unchanged.
3. **League creation flow**: Post-registration wizard: league name, season, dates → auto-generates slug → redirect to scoped admin.
4. **Routing restructure**:
   - Admin becomes `/admin` (scoped to user's league via session `leagueId`).
   - Public becomes `/liga/[slug]/standings`, `/liga/[slug]/matches`, etc.
   - Homepage `/` shows league directory or CTA to create.
5. **Query scoping**: All admin server actions filter by `session.user.leagueId`. Public pages use `slug` → resolve `leagueId` → scope queries.
6. **SUPER_ADMIN experience**: League switcher in sidebar. Can view any league's admin panel.
7. **Analytics scoping**: All `get*` functions in `analytics.ts` accept optional `leagueId` parameter.
8. **Seed update**: Default admin gets `leagueId` pointing to the demo league.
9. **Migration**: Backfill existing `Admin` records with `leagueId = null` (they become SUPER_ADMIN or get assigned to the existing league).

### Out of Scope

- Paid tiers / billing. This is purely the tenant architecture, not the monetization layer.
- Invitation system (invite other admins to a league). Future.
- Multiple admins per league. Future.
- League branding/theming (custom colors, logo per league). Future.
- Subdomain routing (e.g., `mi-liga.ligaextraordinaria.com`). Future.
- API rate limiting per tenant. Future.
- Audit log. Future.

---

## Capabilities

### New Capabilities

- `public-registration`: Self-registration flow with email + password. Creates unassigned admin account.
- `league-creation`: Authenticated user creates a league and becomes its admin owner. Includes slug generation.
- `tenant-scoped-admin`: Admin dashboard and actions scoped to the user's league. Sidebar shows league name.
- `tenant-public-pages`: Public routes under `/liga/[slug]/` scoped to a specific league.
- `super-admin-switcher`: SUPER_ADMIN can browse/switch between all leagues.

### Modified Capabilities

- `admin-auth`: Registration added. Session includes `leagueId`. Role checks account for league ownership.
- `league-configuration`: Slug added. Active league per-tenant (not singleton). League deletion cascades.
- `dashboard-analytics`: All queries accept `leagueId` parameter. Charts are tenant-scoped.
- `category-management`: All admin queries scoped to user's league. Category selector filters by league.
- `team-management`: Scoped to league. Forms pre-filter categories by league.
- `player-management`: Scoped to league. Player team selector scoped to league's teams.
- `match-management`: Scoped to league. Category/team/court selectors scoped.
- `standings-engine`: Recalculate scoped to category → league. Only shows relevant data.
- `court-management`: Courts remain global. No league scope.

---

## Approach

### Architecture Decision: Path-based routing

**Chosen: `/liga/[slug]/...`** over subdomains.

| Factor | Path-based | Subdomain |
|--------|-----------|-----------|
| Dev complexity | Low (Next.js App Router params) | High (wildcard DNS, certs, middleware redirects) |
| Deployment | Single domain, no config | Requires DNS + reverse proxy |
| SUPER_ADMIN switching | Simple: change slug in URL | Requires switching domains |
| SEO | Weaker (subdomain treated as separate site) | Stronger isolation |
| Cookies/Session | Same-domain, no extra config | Cross-subdomain session sharing is tricky |

Path-based is the pragmatic first slice. Subdomain support can be added later as an optional routing strategy.

### Tenent Resolution

```
Request → middleware extracts slug from /liga/[slug]/* → resolves leagueId → attaches to request context
Admin request → session contains leagueId → all queries filter by it
```

For admin actions: the `ensureAuth()` helper also ensures `session.user.leagueId` matches the target resource's league. A new `ensureScope(resource)` helper verifies ownership.

### Migration Strategy

1. Add `slug` to League (nullable initially, then unique+required after backfill).
2. Add `leagueId` to Admin (nullable).
3. Create migration: assign existing admin to the existing league. SUPER_ADMIN keeps `leagueId = null`.
4. Backfill slugs: generate from league name with random suffix for uniqueness.
5. Update seed to associate admin with league.

### URL Mapping

| Current | New |
|---------|-----|
| `/` | `/` (league directory or CTA) |
| `/admin` | `/admin` (scoped via session) |
| `/standings` | `/liga/[slug]/standings` |
| `/matches` | `/liga/[slug]/matches` |
| `/teams/[id]` | `/liga/[slug]/teams/[id]` (via slug in team→category→league chain) |
| `/players/[id]` | `/liga/[slug]/players/[id]` |
| `/goleadores` | `/liga/[slug]/goleadores` |
| `/tarjetas` | `/liga/[slug]/tarjetas` |

Old public routes (`/standings`, `/matches`) redirect to `/liga/[slug]/...` or show a league picker.

---

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | Add `slug` to League, `leagueId` to Admin, cascade deletes |
| `prisma/seed.ts` | Modified | Associate admin with league; create default slug |
| `src/lib/auth.ts` | Modified | Include `leagueId` in JWT + session |
| `src/lib/auth.config.ts` | Modified | Route matcher to include `/liga/` + registration pages |
| `src/types/next-auth.d.ts` | Modified | Add `leagueId` to Session.user and JWT |
| `src/middleware.ts` | Modified | Resolve slug → leagueId for public routes; protect admin routes |
| `src/actions/*.ts` | Modified | Add league scoping to all server actions |
| `src/lib/analytics.ts` | Modified | Add `leagueId` param to all analytics queries |
| `src/app/(dashboard)/admin/*` | Modified | Scoped navigation, sidebar shows league name |
| `src/app/(public)/*` | Modified | Move under `/liga/[slug]/` route group |
| `src/app/(public)/layout.tsx` | Modified | League-aware nav links |
| `src/app/(auth)/login/` | Modified | Add "Create your league" link |
| `src/app/(auth)/register/` | New | Registration page |
| `src/app/(auth)/create-league/` | New | League creation wizard |
| `src/app/(public)/liga/[slug]/` | New | Route group for per-league pages |
| `src/components/layout/sidebar.tsx` | Modified | Show league name, SUPER_ADMIN switcher |
| `src/components/ui/league-selector.tsx` | Modified | Work with slug-based routing |
| `src/actions/league.ts` | Modified | Add slug to CRUD, cascade delete |
| `src/lib/validations/league.ts` | Modified | Add slug field |

---

## Risks & Edge Cases

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| **Existing admin has no league** | High (current seed) | Migration assigns leagueId. SUPER_ADMIN keeps null. |
| **Slug collisions** | Medium | Auto-append random suffix on collision. Manual override allowed. |
| **Admin from League A edits League B data** | High (current gap) | `ensureScope()` in all server actions. Tests for cross-tenant access. |
| **Old bookmarks break** | High (URL change) | Old routes `/standings`, `/matches` redirect to `/liga/[slug]/...` with league picker. |
| **Court association** | Medium | Courts are intentionally global (physical venues). No migration needed. |
| **SUPER_ADMIN creates a league** | Low | They become ADMIN of that league (or we keep them as SUPER_ADMIN with null leagueId). Decision: SUPER_ADMIN keeps global access, can own a league via a secondary scope. |
| **Two admins same email** | Impossible (unique) | Email is unique on Admin model. Each admin has one league. |
| **Analytics raw SQL missing league filter** | Medium | Must update every `$queryRaw` call. Easy to miss one. Audit required. |
| **League deletion massive cascade** | Low | Prisma cascade handles it, but wrap in transaction + confirm dialog. |
| **Session JWT grows** | Low | `leagueId` is a UUID string. Negligible size impact. |

---

## Decision Gaps

These MUST be resolved before specs:

| Question | Options | Recommendation |
|----------|---------|---------------|
| **Slug format** | Auto from name vs manual | Auto-generate from name, allow manual override on creation |
| **Slug uniqueness scope** | Global unique vs per-owner | Global unique (simpler, URL is the tenant identifier). |
| **Registration → League creation** | Combined (one form) vs two-step | Combined: register and create league in one flow. Simpler UX. |
| **Existing admin accounts** | Auto-assign to existing league vs require migration | Auto-assign. SUPER_ADMIN stays unassigned. |
| **Court sharing** | Courts global vs per-league | Global (they represent physical locations). Future: per-league optional. |
| **Homepage when logged in** | Redirect to admin vs show directory | Show directory of leagues with "My League" admin link. If user has one league, redirect. |
| **Public page without slug** | Redirect to first active league vs show picker | Show league picker / directory at `/` |

---

## Constraints

1. **Existing data must not be lost**: The current single-league data must remain accessible via migration.
2. **SUPER_ADMIN must retain full access**: The platform operator must see everything after migration.
3. **Session stays JWT-based**: No session DB changes. `leagueId` added to JWT payload.
4. **Next.js App Router patterns**: No new frameworks. Use route groups, parallel routes, middleware for slug resolution.
5. **Courts stay global**: They model physical venues shared across leagues. Adding per-league courts is a future concern.

---

## Business Tradeoffs

| Decision | Wins | Costs |
|----------|------|-------|
| **Path-based routing** | Fast to ship, simple infra | Weaker SEO isolation per league. Future subdomain migration will need redirects. |
| **Single owner per league** | Clear accountability, simple auth | No shared admin. A league owner cannot delegate. |
| **Global courts** | Zero migration, simpler schema | A league in another city cannot have its own courts. |
| **One-step register+create** | Lower friction, higher conversion | User must name their league during signup — may increase abandonment. |
| **Self-registration** | Viral growth, no manual onboarding | Risk of spam leagues. Mitigation: rate-limit by email, CAPTCHA. |

---

## Rollback Plan

1. **Revert migration**: Run a down-migration that drops `slug` from League and `leagueId` from Admin.
2. **Revert routes**: Restore flat `/standings`, `/matches`, etc. from git.
3. **Revert actions**: Restore `ensureAuth()` without league scoping.
4. **Revert middleware**: Restore original matcher.
5. **Data**: If any leagues were created post-migration, their data is lost on rollback. Export via SQL before reverting.

The rollback is low-risk because it's schema+code, not infrastructure. No external services are involved.

---

## Dependencies

- Prisma migration tooling (already in place).
- No external auth providers. NextAuth with credentials only.
- No DNS or infrastructure changes (path-based routing).

---

## Success Criteria

- [ ] A new user can register and create their league end-to-end.
- [ ] After login, admin sees ONLY their league's data in EVERY page and action.
- [ ] Public pages at `/liga/[slug]/standings` show the correct league's data.
- [ ] SUPER_ADMIN can switch between leagues and see all data.
- [ ] Courts are visible across all leagues (global).
- [ ] Old `/standings` and `/matches` URLs redirect to the correct league page.
- [ ] Analytics (`getGoalsDistribution`, etc.) respect the league filter.
- [ ] Server actions reject cross-tenant access with a clear error.
- [ ] Seed script creates a working demo league with associated admin.
- [ ] Migration backfills existing data without data loss.
- [ ] App builds, all pages render, no type errors.
