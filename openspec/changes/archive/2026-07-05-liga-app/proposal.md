# Proposal: liga-app

## Intent

Build a greenfield soccer league management app (Next.js, App Router, TypeScript, pnpm) that lets a single admin manage players, teams, categories, courts, matches, standings, and disciplinary cards — and lets the public view schedules and standings. The app must be "hermoso como un oso" (beautiful).

## Scope

### In Scope
- Admin auth (email/password, session-based, role-guarded)
- Full CRUD for players, teams, categories, courts
- Match scheduling with round numbers and court assignment
- Standings engine (pts, pj, pg, pe, pp, gf, gc, dg, ta, tr)
- Yellow/red card tracking per player per match
- Public read-only pages (standings table, match schedule)
- Beautiful UI via shadcn/ui + Tailwind CSS

### Out of Scope
- Public registration or multiple admin roles
- Mobile app or public API
- Tournament/playoff bracket generation
- Real-time score updates (WebSockets)
- Payment/fee tracking
- Multi-language i18n

## Capabilities

### New Capabilities
- `admin-auth`: Login, session management, middleware guard for `/admin/*`
- `league-configuration`: League metadata (name, season, active toggle)
- `category-management`: Age-division CRUD (U12, U15, Senior, etc.)
- `team-management`: Team CRUD within a category
- `player-management`: Player registration, jersey number, DNI, team assignment
- `court-management`: Field/court CRUD with address and capacity
- `match-management`: Fixture scheduling, score entry, round numbers, status flow
- `standings-engine`: Derived position table from match results
- `card-tracking`: Yellow/red cards per player per match, accumulation

### Modified Capabilities
None — greenfield project, no existing specs.

## Approach

Monolith with Server Components for reads + Server Actions for mutations. PostgreSQL + Prisma ORM on Neon (free tier). Auth.js v5 (Credentials provider) for admin-only access. shadcn/ui + Tailwind CSS for UI. TanStack Table for standings data tables. React Hook Form + Zod for form validation. Lucide icons.

See exploration doc for full entity model (11 entities: Admin, League, Category, Team, Player, Court, Match, Goal, Card, Standing).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/(auth)/login/` | New | Login page |
| `src/app/(dashboard)/admin/*` | New | Protected admin CRUD pages |
| `src/app/standings/` | New | Public standings view |
| `src/app/matches/` | New | Public match schedule |
| `src/components/` | New | UI components, forms, tables |
| `src/lib/db.ts` | New | Prisma client singleton |
| `src/lib/auth.ts` | New | Auth.js config |
| `src/actions/` | New | Server Actions per domain |
| `prisma/schema.prisma` | New | Full schema (11 models) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Standings edge cases (walkovers, byes) | Med | Build a testable engine module with known scenarios |
| Card accumulation rules vary by league | Med | Make rules configurable from day one (env or config) |
| Court double-booking on same datetime | Low | Validate court availability in match Server Action |
| Partial match data entry (goals without cards) | Med | Use Prisma transactions to enforce atomic match result entry |
| Scope creep: auth roles grow | Low | Use role enum (`admin` | `manager`), not a boolean flag |

## Rollback Plan

- Schema changes use Prisma migrations → rollback with `prisma migrate reset` in dev or `prisma migrate down` in prod
- Vercel deploy: enable instant rollback through Vercel dashboard
- Before seeding production data, take a full DB backup
- Each capability is independently deployable (no cross-capability breaking changes in v1)

## Dependencies

- Node.js >= 20, pnpm
- Neon or Supabase account (or local PostgreSQL)
- Vercel account for deployment (optional for dev)

## Success Criteria

- [ ] Admin can log in, create a league with categories, teams, and players
- [ ] Admin can schedule matches with courts, enter scores, and assign cards
- [ ] Standings table auto-updates after match results are entered
- [ ] Public users can view match schedules and standings without login
- [ ] All forms validate input and show clear error messages
- [ ] App looks polished on desktop and mobile (responsive)
- [ ] `pnpm build` succeeds without errors
