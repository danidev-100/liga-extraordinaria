# Design: Multi-Liga (Multi-Tenant League Support)

## Technical Approach

Add tenant isolation via path-based routing (`/liga/[slug]/...` and `/admin/ligas/[slug]/...`) without creating an entirely separate architecture. Slug resolves league ID in middleware; all server actions and analytics filter by `leagueId`. Courts stay global — no league scope. One-step registration creates league + admin in a single flow.

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Admin model rename (`Admin` → `User`) | Rename touches every import vs. just add `leagueId` field | **Keep `Admin` model name** — add nullable `leagueId`; less churn |
| Singleton `isActive` | Currently only one league active at a time | **Drop singleton logic** — `toggleLeagueActive` stops deactivating others; `isActive` is per-league |
| Slug storage | Computed vs. column | **`slug` column** — queryable, indexable, no runtime computation |
| Middleware auth for `/liga/[slug]` | Public pages don't need auth, but slug resolution does | **Middleware resolves slug** → injects `leagueId` into `request.nextUrl.searchParams` for public routes |
| Admin routing | `/admin/ligas/[slug]/...` vs. `/admin` with redirect | **Nested under `/admin/ligas/[slug]/`** — explicit URL, works without JS, supports multi-league SUPER_ADMIN |

## Data Flow

```
Request → middleware → extract slug → resolve leagueId → attach to request/server context
                              ↓
                    Admin: session.user.leagueId scopes actions
                    Public: slug → leagueId from DB → filter queries
                              ↓
                    ensureScope(leagueId) — every server action
                    $queryRaw analytics — leagueId in WHERE clause
```

**Registration flow:**
```
Signup form → create Admin (no league yet) → create League with slug →
  update Admin.leagueId → sign in → redirect to /admin/ligas/[slug]/dashboard
```

**SUPER_ADMIN flow:**
```
Session user.role === SUPER_ADMIN → bypass leagueId filter →
  sidebar shows league switcher → navigate to any /admin/ligas/[slug]/...
```

## Slug Generation

```typescript
function generateSlug(name: string): string {
  let slug = name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  // Append counter on collision
  let candidate = slug
  let counter = 1
  while (await db.league.findUnique({ where: { slug: candidate } })) {
    candidate = `${slug}-${counter++}`
  }
  return candidate
}
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modify | Add `slug` to League (unique), `leagueId` (nullable) to Admin, cascade deletes on Category/League |
| `prisma/seed.ts` | Modify | Assign admin to demo league via `leagueId`, add `slug` |
| `src/lib/auth.ts` | Modify | Read `leagueId` in `authorize()`, include in JWT + session callbacks |
| `src/types/next-auth.d.ts` | Modify | Add `leagueId` to `Session.user` and `JWT` |
| `src/lib/auth.config.ts` | Modify | Add `/liga/` and `/register` to matcher |
| `src/middleware.ts` | Modify | Resolve slug from `/liga/[slug]/` paths, protect `/admin/ligas/*` |
| `src/lib/db.ts` | No change | Already singleton — no changes needed |
| `src/lib/analytics.ts` | Modify | Add `leagueId: string` param to every query function; add JOIN to `leagues` or filter via `teams → categories → leagues` |
| `src/actions/*.ts` | Modify | All 9 action files: accept `leagueId`, add `ensureScope()`, filter queries |
| `src/lib/validations/league.ts` | Modify | Add optional `slug` field, add `slug` to schema |
| `src/actions/league.ts` | Modify | `createLeague` generates slug, `toggleLeagueActive` stops singleton deactivation |
| `src/app/page.tsx` | Modify | Homepage shows league directory or CTA; stats scoped to active league(s) |
| `src/app/(dashboard)/admin/` | Restructure | Move all admin pages under `/admin/ligas/[slug]/` route group |
| `src/app/(dashboard)/layout.tsx` | Modify | League-aware redirect: if user has leagueId → redirect to `/admin/ligas/[slug]/` |
| `src/app/(dashboard)/admin/page.tsx` | Modify | Only show dashboard for selected league; SUPER_ADMIN sees all |
| `src/app/(public)/layout.tsx` | Modify | Nav links use `/liga/[slug]/...`, resolve slug from params or redirect to picker |
| `src/app/(public)/standings/` | Move | Move `<LeagueSelector>` logic to route params; page reads `slug` from segment |
| `src/app/(public)/liga/[slug]/` | New | Route group: standings, matches, teams, players, goleadores, tarjetas |
| `src/app/(auth)/register/` | New | Registration page with league creation form |
| `src/app/(auth)/login/page.tsx` | Modify | Add "Create your league" link |
| `src/components/layout/sidebar.tsx` | Modify | Accept `leagueSlug`, generate scoped links `/admin/ligas/[slug]/...`, show league name, SUPER_ADMIN switcher |
| `src/components/ui/league-selector.tsx` | Modify | Accept leagues with `slug`, use path-based selection |

## Interfaces / Contracts

```typescript
// Extended Session user
interface SessionUser {
  id: string
  role: "ADMIN" | "SUPER_ADMIN"
  leagueId: string | null  // null for SUPER_ADMIN or unassigned
  name?: string | null
  email?: string | null
}

// ensureScope — wraps every server action
function ensureScope(session: Session, leagueId: string): void {
  if (session.user.role !== "SUPER_ADMIN" && session.user.leagueId !== leagueId) {
    throw new Error("Acceso no autorizado a esta liga")
  }
}

// Analytics — all exported functions get optional leagueId
export async function getGoalsDistribution(leagueId?: string): Promise<GoalsDistribution[]>
export async function getLeastConceded(leagueId?: string): Promise<GoalsDistribution[]>
export async function getCardsBreakdown(leagueId?: string): Promise<CardsBreakdown[]>
export async function getFormTrend(categoryId?: string, leagueId?: string): Promise<FormTrendRow[]>
export async function getTopScorers(limit?: number, leagueId?: string): Promise<TopScorerRow[]>

// Slug generation contract
export async function createLeague(data: LeagueFormData, adminId: string): Promise<League>
  // Generates slug from data.name
  // Handles collision via numeric suffix
  // Sets the creating admin's leagueId
```

## Analytics SQL Pattern

Every raw SQL query joins through `teams → categories → leagues`:

```sql
-- Before (unscoped):
SELECT ... FROM goals g
JOIN matches m ON m.id = g.match_id

-- After (scoped):
SELECT ... FROM goals g
JOIN matches m ON m.id = g.match_id
JOIN teams t ON t.id = g.team_id
JOIN categories cat ON cat.id = t.category_id
WHERE cat.league_id = ${leagueId}::uuid
```

Apply this pattern to all 5 queries in `lib/analytics.ts`: `getGoalsDistribution`, `getLeastConceded`, `getCardsBreakdown`, `getFormTrend`, `getTopScorers`.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `generateSlug()` | Collision handling, accent normalization, edge cases (empty, special chars) |
| Unit | `ensureScope()` | Rejects cross-tenant, allows SUPER_ADMIN bypass |
| Unit | `processCards()` | Existing test — verify it still works with leagueId context |
| Integration | Admin actions with league filter | Create 2 leagues, verify admin from league A cannot write league B data |
| Integration | Analytics scoping | Raw SQL queries with leagueId return correct scoped results |
| E2E | Registration → league creation | Full flow: register, create league, login, see scoped dashboard |
| E2E | SUPER_ADMIN switcher | SUPER_ADMIN sees league directory, can navigate between leagues |

## Migration / Rollout

1. **Schema**: Add `slug` (nullable unique) to League, add `leagueId` (nullable) to Admin, change Category → League onDelete to Cascade
2. **Backfill**: Generate slug for existing league from name, assign existing admin to demo league via leagueId
3. **Enforce**: Make `slug` required unique, add index on `Admin.leagueId`
4. **Code**: Deploy new routes alongside old — old public routes redirect to `/liga/[slug]/...`
5. **Old routes**: Keep as redirect fallback for one release cycle, then remove

**Rollback**: Revert migration (drop `slug`, `leagueId`), restore old route structure from git.

## Open Questions

- [ ] SUPER_ADMIN leagueId stays null — but should SUPER_ADMIN be able to create leagues and own them? If yes, they need a second mechanism (create with `leagueId` set, then retain null for global access)
