## Exploration: liga-app

### Current State
Greenfield project — no code. Project directory exists with SDD scaffolding (`openspec/` config, `changes/liga-app/`, `.atl/`). No database, no auth, no UI. Tech stack pre-decided: Next.js (App Router), TypeScript, pnpm.

### Domain Entity Model

The following entities and relationships emerge from user requirements:

```
Admin (User)
  └── manages ───────────────────────────┐
                                         ▼
League/Tournament ──1:N──> Category (U12, U15, Senior, etc.)
  │                                       │
  │                                       ├──1:N──> Team
  │                                       │           │
  └── metadata: name, season, dates       │           └──1:N──> Player
                                          │
                                          ├──1:N──> Match
                                          │           │
                                          │           ├──N:1──> Court/Field (where played)
                                          │           ├──M:N──> Team (local & visitor)
                                          │           ├──1:N──> Goal (scored in match)
                                          │           └──1:N──> Card (yellow/red, per player)
                                          │
                                          └──1:1──> Standing (derived stats per team)
                                                       ├── Pts (points)
                                                       ├── PJ (partidos jugados)
                                                       ├── PG (partidos ganados)
                                                       ├── PE (partidos empatados)
                                                       ├── PP (partidos perdidos)
                                                       ├── GF (goles a favor)
                                                       ├── GC (goles en contra)
                                                       ├── DG (diferencia de gol)
                                                       ├── TA (tarjetas amarillas)
                                                       └── TR (tarjetas rojas)
```

### Detailed Entity Design

| Entity | Attributes | Relations | Notes |
|--------|-----------|-----------|-------|
| **Admin** | id, name, email, password_hash, role | manages all | Auth-protected, only admin creates data |
| **League** | id, name, season, start_date, end_date, is_active | has Categories | Top-level container |
| **Category** | id, name (e.g. "U12"), min_age, max_age, league_id | has Teams, Matches, Standings | Age-group divisions within a league |
| **Team** | id, name, short_name, logo_url, category_id, color | has Players, has Standings | Belongs to exactly one category |
| **Player** | id, name, surname, dni, birth_date, photo_url, team_id, jersey_number, is_active | receives Cards, scores Goals | Registered to a team |
| **Court** | id, name, address, city, capacity | hosts Matches | Where matches are played |
| **Match** | id, category_id, court_id, date, time, local_team_id, visitor_team_id, local_score, visitor_score, status (scheduled/playing/finished), round | has Goals, has Cards | Central fixture entity |
| **Goal** | id, match_id, player_id, team_id, minute, is_own_goal | — | Each goal record |
| **Card** | id, match_id, player_id, team_id, type (yellow/red), minute | — | Discipline tracking |
| **Standing** | id, category_id, team_id, pts, pj, pg, pe, pp, gf, gc, dg, ta, tr, position | — | Derived/updated after each match |

### Database Schema Approach

#### Option A: PostgreSQL + Prisma (Recommended)
- **Why**: Scalable, production-grade, JSONB for flexible match data, enums for card types, real constraints
- **Hosting**: Neon (serverless Postgres, free tier) or Supabase (Postgres + auth + storage)
- **Prisma**: Best-in-class DX for Next.js, auto-generated types, migrations, great with TypeScript
- **Migration cost**: Requires local Postgres or remote DB from day one

#### Option B: SQLite + Prisma
- **Why**: Zero setup, file-based, good for prototyping or single-server
- **Limits**: No concurrent writes, no row-level security, harder to scale
- **When**: Only if the app stays single-tenant admin-only with no public write access

**Verdict**: PostgreSQL + Prisma. The app is a web app, not a CLI tool. Postgres gives us real constraints, enums, and future-proofing. Serverless Postgres (Neon/Supabase) is free for small scale.

### Next.js Architecture

#### App Router Structure

```
src/
├── app/
│   ├── (auth)/           ← Auth pages (login)
│   │   └── login/
│   ├── (dashboard)/      ← Protected routes (layout with sidebar)
│   │   ├── admin/        ← Admin panel (admin-only)
│   │   │   ├── players/
│   │   │   ├── teams/
│   │   │   ├── categories/
│   │   │   ├── courts/
│   │   │   ├── matches/
│   │   │   └── standings/
│   │   ├── standings/    ← Public standings view
│   │   └── matches/      ← Public match schedule
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/               ← shadcn/ui primitives
│   ├── forms/            ← Admin form components
│   └── standings/        ← Standings table (data viz)
├── lib/
│   ├── db.ts             ← Prisma client singleton
│   ├── auth.ts           ← NextAuth/Auth.js config
│   └── validations/      ← Zod schemas
├── actions/              ← Server Actions (form handlers)
│   ├── players.ts
│   ├── matches.ts
│   └── standings.ts
└── types/
    └── index.ts
```

#### Component Split Strategy

| Page | Component Type | Why |
|------|---------------|-----|
| Standings table | **Server Component** | Read-only data, render on server, cacheable |
| Match schedule | **Server Component** | Read-only, SSR for SEO |
| Admin forms | **Client Component** | Interactive forms, state, validation |
| Login | **Client Component** | Session management, form interaction |
| Dashboard layout | **Server Component** | Static shell, sidebar nav |
| Standings row | **Client Component** | If real-time updates needed |

#### Data Fetching Strategy

**Server Actions** (recommended for this app):
- Mutations (create/edit/delete players, teams, matches) → Server Actions with revalidation
- Reads via direct Prisma calls in Server Components
- No API routes needed unless building a mobile client later

**Why Server Actions over tRPC**:
- Simpler for admin-only CRUD, less boilerplate
- Built-in progressive enhancement
- tRPC adds value when you have public API consumers — overkill here

### UI/Tech Stack Recommendations

| Layer | Choice | Why |
|-------|--------|-----|
| **UI Framework** | shadcn/ui + Tailwind CSS | Beautiful defaults, accessible, composable, active community |
| **Forms** | React Hook Form + Zod | De facto standard for Next.js forms, type-safe validation |
| **Standings Table** | TanStack Table (react-table) | Sortable, filterable, paginated tables out of the box |
| **Icons** | Lucide React | Ships with shadcn/ui, comprehensive sports icons |
| **Charts** | Recharts | Lightweight, React-native, good for stat dashboards |
| **Color Theme** | Football-pitch greens + warm earth tones | "Hermoso como un oso" → warm, natural, beautiful |

### Auth Approach

**NextAuth.js / Auth.js v5** (recommended):
- Credentials provider for admin login (email + password)
- Middleware to protect `/admin/*` routes
- Session stored in JWT (no DB session table needed)
- Role-based: `admin` role check on protected pages

**Why not Clerk**: Overkill for single-admin app. Clerk excels at multi-provider social auth and user management. This app has one admin type.

**Why not custom auth**: Would need to re-implement password hashing, session management, CSRF protection — unnecessary risk.

### Key Decisions Summary

| Decision | Recommendation | Alternative | Rationale |
|----------|---------------|-------------|-----------|
| Database | PostgreSQL | SQLite | Production-ready, proper constraints, real enums |
| ORM | Prisma | Drizzle | Better TypeScript gen, migration DX, wider ecosystem with Next.js |
| Auth | Auth.js v5 | Clerk, custom | Right-sized for single-admin, free, self-hosted |
| Forms | React Hook Form + Zod | plain HTML forms | Type-safe validation, best ecosystem with shadcn/ui |
| UI | shadcn/ui + Tailwind | MUI, Chakra | Beautiful by default, accessible, copy-paste ownership model |
| Tables | TanStack Table | custom tables | Sort/filter/pagination out of the box |
| Data Fetching | Server Actions + Server Components | tRPC, API routes | Simplest for admin CRUD, no extra deps |

### Effort Estimate

| Phase | Estimated Effort | Key Deliverables |
|-------|-----------------|-------------------|
| Scaffold & DB setup | Low | Next.js init, Prisma schema, migrations, seed |
| Auth | Medium | Login page, session, middleware, admin guard |
| Player/Team CRUD | Medium | Forms, server actions, list/detail pages |
| Match scheduling | High | Fixture creation, court assignment, score entry |
| Standings engine | High | Derive positions from match results, handle edge cases |
| Cards & stats | Medium | Yellow/red tracking, accumulation rules |
| UI polish | Medium | "Beautiful like a bear" — color, typography, animations |

### Approaches

1. **Monolith with Server Actions** — All-in-one Next.js app with Server Components + Server Actions for mutations
   - Pros: Single deployment, minimal boilerplate, progressive enhancement, fast iterations
   - Cons: Tighter coupling between UI and data layer, harder to swap if mobile app comes later
   - Effort: Medium

2. **API Routes + Client-heavy SPA** — Traditional REST API with client-side state management
   - Pros: Clear API boundary, reusable for mobile client
   - Cons: More boilerplate (API routes + client state), worse SEO for public pages, hydration overhead
   - Effort: High

3. **tRPC** — End-to-end typesafe API with Next.js integration
   - Pros: Type safety across the wire, great developer experience
   - Cons: Overkill for admin CRUD, adds dependency, mobile client needs tRPC client
   - Effort: Medium

### Recommendation

**Approach 1: Monolith with Server Actions**

- Direct Prisma calls in Server Components for reads
- Server Actions for mutations (create/update/delete)
- Server Components for public pages (standings, schedule)
- Client Components only for interactive admin forms
- Auth.js v5 for admin authentication
- shadcn/ui + Tailwind for the beautiful frontend
- PostgreSQL + Prisma on Neon (free tier)

This is the right call because:
1. The app is admin-driven with limited public read access — no need for a separate API
2. Server Actions reduce boilerplate significantly vs API routes
3. Server Components give great performance out of the box
4. When/if a mobile app is needed, we can extract a tRPC layer from the existing Prisma schema

### Risks

- **Standings calculation complexity**: Deriving standings from match results seems simple but has edge cases (walkovers, penalties, incomplete rounds). The standings engine needs careful design and testing.
- **Card accumulation rules**: Yellow card accumulation leading to suspensions is a real pain point — different leagues have different rules (e.g., 2 yellows = suspension, or 5 yellows). Need configurable rules from the start.
- **Match scheduling conflicts**: Same court + same time = double booking. Need validation to prevent scheduling conflicts.
- **Data integrity**: When a match result is entered, goals and cards must be entered together. Partial data entry leads to inconsistencies. Should use transactions.
- **Auth scope creep**: "Admin" could grow into multiple roles (super-admin, category-manager, referee). Design the auth model to be extensible from day one (role enum, not boolean).

### Ready for Proposal
Yes — the domain is well-understood, the entity model is clear, and the tech stack decisions are straightforward. The orchestrator should proceed to `sdd-propose` with the recommended approach.
