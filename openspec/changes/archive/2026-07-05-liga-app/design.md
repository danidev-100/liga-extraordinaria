# Design: liga-app

## Technical Approach

Monolith with Server Components for reads + Server Actions for mutations. PostgreSQL + Prisma ORM. Auth.js v5 Credentials provider for admin-only auth. Standings engine runs as a pure function + Prisma `$transaction` for atomic recalculations. All 9 specs (admin-auth through card-tracking) covered in a single schema and app structure.

---

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  admin
  manager
}

enum MatchStatus {
  scheduled
  playing
  finished
}

enum CardType {
  yellow
  red
}

model Admin {
  id           String    @id @default(uuid()) @db.Uuid
  name         String
  email        String    @unique
  passwordHash String    @map("password_hash")
  role         UserRole  @default(admin)
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  @@map("admins")
}

model League {
  id        String     @id @default(uuid()) @db.Uuid
  name      String
  season    String
  startDate DateTime   @map("start_date")
  endDate   DateTime   @map("end_date")
  isActive  Boolean    @default(false) @map("is_active")
  createdAt DateTime   @default(now()) @map("created_at")
  updatedAt DateTime   @updatedAt @map("updated_at")
  categories Category[]

  @@map("leagues")
}

model Category {
  id       String   @id @default(uuid()) @db.Uuid
  name     String
  minAge   Int      @map("min_age")
  maxAge   Int      @map("max_age")
  leagueId String   @map("league_id") @db.Uuid
  league   League   @relation(fields: [leagueId], references: [id], onDelete: Restrict)
  teams    Team[]
  matches  Match[]
  standings Standing[]

  @@unique([name, leagueId])
  @@map("categories")
}

model Team {
  id         String   @id @default(uuid()) @db.Uuid
  name       String
  shortName  String   @map("short_name")
  logoUrl    String?  @map("logo_url")
  categoryId String   @map("category_id") @db.Uuid
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  color      String?
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")
  players    Player[]
  localMatches Match[] @relation("LocalTeam")
  visitorMatches Match[] @relation("VisitorTeam")
  goals      Goal[]
  cards      Card[]
  standing   Standing?

  @@unique([name, categoryId])
  @@map("teams")
}

model Player {
  id           String   @id @default(uuid()) @db.Uuid
  name         String
  surname      String
  dni          String   @unique
  birthDate    DateTime @map("birth_date")
  photoUrl     String?  @map("photo_url")
  teamId       String   @map("team_id") @db.Uuid
  team         Team     @relation(fields: [teamId], references: [id], onDelete: Restrict)
  jerseyNumber Int?     @map("jersey_number")
  isActive     Boolean  @default(true) @map("is_active")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  goals        Goal[]
  cards        Card[]

  @@map("players")
}

model Court {
  id        String   @id @default(uuid()) @db.Uuid
  name      String
  address   String?
  city      String
  capacity  Int?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  matches   Match[]

  @@map("courts")
}

model Match {
  id             String      @id @default(uuid()) @db.Uuid
  categoryId     String      @map("category_id") @db.Uuid
  category       Category    @relation(fields: [categoryId], references: [id])
  courtId        String      @map("court_id") @db.Uuid
  court          Court       @relation(fields: [courtId], references: [id])
  date           DateTime
  time           String      // stored as "HH:mm"
  localTeamId    String      @map("local_team_id") @db.Uuid
  localTeam      Team        @relation("LocalTeam", fields: [localTeamId], references: [id])
  visitorTeamId  String      @map("visitor_team_id") @db.Uuid
  visitorTeam    Team        @relation("VisitorTeam", fields: [visitorTeamId], references: [id])
  localScore     Int?        @map("local_score")
  visitorScore   Int?        @map("visitor_score")
  status         MatchStatus @default(scheduled)
  round          Int
  createdAt      DateTime    @default(now()) @map("created_at")
  updatedAt      DateTime    @updatedAt @map("updated_at")
  goals          Goal[]
  cards          Card[]

  @@map("matches")
}

model Goal {
  id        String  @id @default(uuid()) @db.Uuid
  matchId   String  @map("match_id") @db.Uuid
  match     Match   @relation(fields: [matchId], references: [id], onDelete: Cascade)
  playerId  String  @map("player_id") @db.Uuid
  player    Player  @relation(fields: [playerId], references: [id])
  teamId    String  @map("team_id") @db.Uuid
  team      Team    @relation(fields: [teamId], references: [id])
  minute    Int
  isOwnGoal Boolean @default(false) @map("is_own_goal")

  @@map("goals")
}

model Card {
  id       String   @id @default(uuid()) @db.Uuid
  matchId  String   @map("match_id") @db.Uuid
  match    Match    @relation(fields: [matchId], references: [id], onDelete: Cascade)
  playerId String   @map("player_id") @db.Uuid
  player   Player   @relation(fields: [playerId], references: [id])
  teamId   String   @map("team_id") @db.Uuid
  team     Team     @relation(fields: [teamId], references: [id])
  type     CardType
  minute   Int

  @@map("cards")
}

model Standing {
  id         String   @id @default(uuid()) @db.Uuid
  categoryId String   @map("category_id") @db.Uuid
  category   Category @relation(fields: [categoryId], references: [id])
  teamId     String   @map("team_id") @db.Uuid
  team       Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  pts        Int      @default(0)
  pj         Int      @default(0)
  pg         Int      @default(0)
  pe         Int      @default(0)
  pp         Int      @default(0)
  gf         Int      @default(0)
  gc         Int      @default(0)
  dg         Int      @default(0)
  ta         Int      @default(0)
  tr         Int      @default(0)
  position   Int      @default(0)

  @@unique([categoryId, teamId])
  @@map("standings")
}
```

---

## Next.js App Router Structure

```
src/app/
├── (auth)/
│   └── login/
│       └── page.tsx              ← Client Component: login form
├── (public)/                     ← no special layout
│   ├── standings/
│   │   └── page.tsx              ← Server Component: public standings table
│   └── matches/
│       └── page.tsx              ← Server Component: public match schedule
├── (dashboard)/                  ← layout.tsx checks session, renders sidebar
│   ├── layout.tsx                ← Server Component: sidebar nav shell
│   ├── page.tsx                  ← redirect → /admin/dashboard
│   └── admin/
│       ├── page.tsx              ← Dashboard home (stats overview)
│       ├── players/
│       │   ├── page.tsx          ← Server Component: data table (list)
│       │   ├── new/page.tsx      ← Client Component: create form
│       │   └── [id]/page.tsx     ← Client Component: edit form
│       ├── teams/
│       │   ├── page.tsx          ← Server Component: list
│       │   ├── new/page.tsx      ← Client Component: create form
│       │   └── [id]/page.tsx     ← Client Component: edit form
│       ├── categories/
│       │   ├── page.tsx          ← Server Component: list
│       │   ├── new/page.tsx      ← Client Component: create form
│       │   └── [id]/page.tsx     ← Client Component: edit form
│       ├── courts/
│       │   ├── page.tsx          ← Server Component: list
│       │   ├── new/page.tsx      ← Client Component: create form
│       │   └── [id]/page.tsx     ← Client Component: edit form
│       ├── matches/
│       │   ├── page.tsx          ← Server Component: list
│       │   ├── new/page.tsx      ← Client Component: create form
│       │   └── [id]/page.tsx     ← Client Component: match detail + score entry + cards
│       └── league/
│           └── page.tsx          ← Client Component: league config form
├── layout.tsx                    ← Root layout: html, fonts, providers
└── page.tsx                      ← Home page: hero + links
```

---

## Component Tree

```
RootLayout (Server)
├── AuthLayout (Server)   ← (auth)/layout.tsx
│   └── LoginForm (Client) ← React Hook Form + Zod
├── PublicLayout (Server) ← (public)/layout.tsx
│   ├── StandingsTable (Server)  ← direct Prisma read
│   │   └── StandingsRow (Client)← TanStack Table row
│   └── MatchSchedule (Server)
└── DashboardLayout (Server) ← (dashboard)/layout.tsx
    ├── Sidebar (Client)        ← nav links, active state
    ├── DataTable (Client)      ← TanStack Table wrapper (reused)
    ├── AdminForms (Client)     ← RHF forms per entity
    ├── MatchDetail (Client)    ← score + goals + cards entry
    └── StandingsAdmin (Client) ← admin view with sort/filter
```

---

## Data Flow

```
Browser ──GET──→ Server Component ──prisma.findMany()──→ PostgreSQL
                    │
                    └──→ Rendered HTML ──→ Browser (RSC)

Browser ──POST──→ Server Action ──prisma.$transaction()──→ PostgreSQL
                    │                                        │
                    ├── zod validation                         └── recalculate standings
                    ├── auth check (session)
                    └── revalidatePath() → re-render RSC
```

Key flow for standings: After every match status change to `finished`, the Server Action:
1. Validates scores (both required)
2. Saves goals + cards + match status in one `$transaction`
3. Calls `recalculateStandings(categoryId)` — pure function that aggregates all finished matches and upserts Standing rows
4. `revalidatePath()` triggers RSC re-render

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| ORM | Prisma | Auto-generated types, migration DX, best Next.js ecosystem fit |
| Auth | Auth.js v5 Credentials | Right-sized for single-admin. JWT sessions, no DB sessions needed |
| Database | PostgreSQL | Real enums, constraints, production-ready. Neon free tier |
| Forms | RHF + Zod | Type-safe validation, shadcn/ui native interop |
| Standings update | Prisma `$transaction` | Atomic — match save + standings recalc in one DB roundtrip |
| Tables | TanStack Table | Built-in sort/filter/pagination, headless, React 18 compatible |
| Component split | RSC for reads, Client for forms | Maximizes SSR perf, minimizes JS bundle on public pages |
| Auth middleware | Next.js `middleware.ts` | Route-level guard without per-page checks |
| Active league | Single-active pattern | Deactivate current before activating new — unique partial index |

---

## File Changes (all NEW — greenfield)

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Create | Full 11-model schema with enums, relations, indexes |
| `prisma/seed.ts` | Create | Dev seed: admin user, league, categories, teams, players |
| `src/lib/db.ts` | Create | Prisma client singleton (edge-safe) |
| `src/lib/auth.ts` | Create | Auth.js v5 config: Credentials provider, JWT callback, role in token |
| `src/lib/validations/league.ts` | Create | Zod schemas for league form |
| `src/lib/validations/category.ts` | Create | Zod schemas for category form |
| `src/lib/validations/team.ts` | Create | Zod schemas for team form (includes unique name check in category) |
| `src/lib/validations/player.ts` | Create | Zod schemas for player form (DNI, birthDate) |
| `src/lib/validations/court.ts` | Create | Zod schemas for court form |
| `src/lib/validations/match.ts` | Create | Zod schemas for match + goals + cards |
| `src/lib/standings.ts` | Create | Pure function: calculate standings from finished matches |
| `src/actions/league.ts` | Create | Server Actions: create/update/delete league, toggle active |
| `src/actions/category.ts` | Create | Server Actions: CRUD category |
| `src/actions/team.ts` | Create | Server Actions: CRUD team |
| `src/actions/player.ts` | Create | Server Actions: CRUD player |
| `src/actions/court.ts` | Create | Server Actions: CRUD court |
| `src/actions/match.ts` | Create | Server Actions: create/schedule match, enter result (+ goals + cards) |
| `src/middleware.ts` | Create | Next.js middleware: protect `/admin/*`, redirect to `/login` |
| `src/app/layout.tsx` | Create | Root layout: Inter font, SessionProvider, Toaster |
| `src/app/page.tsx` | Create | Home page: hero, links to standings, matches, login |
| `src/app/(auth)/login/page.tsx` | Create | Login page with form |
| `src/app/(public)/standings/page.tsx` | Create | Server Component: read standings, render TanStack table |
| `src/app/(public)/matches/page.tsx` | Create | Server Component: read matches, render schedule |
| `src/app/(dashboard)/layout.tsx` | Create | Dashboard layout: sidebar, header, auth check |
| `src/app/(dashboard)/page.tsx` | Create | Redirect to `/admin/dashboard` |
| `src/app/(dashboard)/admin/page.tsx` | Create | Dashboard home with summary stats |
| `src/app/(dashboard)/admin/players/page.tsx` | Create | Server Component player list |
| `src/app/(dashboard)/admin/players/new/page.tsx` | Create | Client Component create player form |
| `src/app/(dashboard)/admin/players/[id]/page.tsx` | Create | Client Component edit player form |
| `src/app/(dashboard)/admin/teams/page.tsx` | Create | Server Component team list |
| `src/app/(dashboard)/admin/teams/new/page.tsx` | Create | Client Component create team form |
| `src/app/(dashboard)/admin/teams/[id]/page.tsx` | Create | Client Component edit team form |
| `src/app/(dashboard)/admin/categories/page.tsx` | Create | Server Component category list |
| `src/app/(dashboard)/admin/categories/new/page.tsx` | Create | Client Component create category form |
| `src/app/(dashboard)/admin/categories/[id]/page.tsx` | Create | Client Component edit category form |
| `src/app/(dashboard)/admin/courts/page.tsx` | Create | Server Component court list |
| `src/app/(dashboard)/admin/courts/new/page.tsx` | Create | Client Component create court form |
| `src/app/(dashboard)/admin/courts/[id]/page.tsx` | Create | Client Component edit court form |
| `src/app/(dashboard)/admin/matches/page.tsx` | Create | Server Component match list |
| `src/app/(dashboard)/admin/matches/new/page.tsx` | Create | Client Component create match form (court availability check) |
| `src/app/(dashboard)/admin/matches/[id]/page.tsx` | Create | Client Component match detail + score/goal/card entry |
| `src/app/(dashboard)/admin/league/page.tsx` | Create | Client Component league config form |
| `src/components/ui/*.tsx` | Create | shadcn/ui primitives (button, input, card, table, dialog, etc.) |
| `src/components/forms/player-form.tsx` | Create | Reusable RHF form for player CRUD |
| `src/components/forms/team-form.tsx` | Create | Reusable RHF form for team CRUD |
| `src/components/forms/category-form.tsx` | Create | Reusable RHF form for category CRUD |
| `src/components/forms/court-form.tsx` | Create | Reusable RHF form for court CRUD |
| `src/components/forms/match-form.tsx` | Create | Reusable RHF form for match + score entry |
| `src/components/forms/league-form.tsx` | Create | Reusable RHF form for league config |
| `src/components/standings/standings-table.tsx` | Create | TanStack Table wrapper for standings |
| `src/components/standings/standings-columns.tsx` | Create | Column definitions for standings table |
| `src/components/layout/sidebar.tsx` | Create | Dashboard sidebar nav |
| `src/components/layout/session-provider.tsx` | Create | Auth.js SessionProvider wrapper |
| `package.json` | Create | Dependencies: next, react, prisma, auth.js, shadcn, etc. |
| `tsconfig.json` | Create | TypeScript config for Next.js 15 |
| `next.config.ts` | Create | Next.js 15 configuration |
| `tailwind.config.ts` | Create | Tailwind CSS theme config |
| `postcss.config.js` | Create | PostCSS config for Tailwind |
| `.env.example` | Create | Environment variables template |
| `components.json` | Create | shadcn/ui configuration |

---

## Interfaces / Contracts

### Standings Engine (pure function)

```typescript
// src/lib/standings.ts
export interface StandingInput {
  teamId: string
  matches: { localTeamId: string; visitorTeamId: string; localScore: number; visitorScore: number }[]
  goals: { teamId: string; isOwnGoal: boolean }[]
  cards: { teamId: string; type: 'yellow' | 'red' }[]
}

export interface StandingRow {
  teamId: string
  pts: number; pj: number; pg: number; pe: number; pp: number
  gf: number; gc: number; dg: number
  ta: number; tr: number
}

export function calculateStandings(input: StandingInput[]): StandingRow[]
```

### Server Action Pattern

```typescript
// src/actions/match.ts
'use server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { recalculateCategoryStandings } from '@/lib/standings'

const finishMatchSchema = z.object({
  matchId: z.string().uuid(),
  localScore: z.number().min(0),
  visitorScore: z.number().min(0),
  goals: z.array(z.object({ playerId: z.string().uuid(), teamId: z.string().uuid(), minute: z.number(), isOwnGoal: z.boolean() })),
  cards: z.array(z.object({ playerId: z.string().uuid(), teamId: z.string().uuid(), type: z.enum(['yellow','red']), minute: z.number() })),
})

export async function finishMatch(formData: FormData) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const parsed = finishMatchSchema.parse(formData) // or Object.fromEntries

  return await db.$transaction(async (tx) => {
    const match = await tx.match.update({
      where: { id: parsed.matchId },
      data: { status: 'finished', localScore: parsed.localScore, visitorScore: parsed.visitorScore },
    })
    // Create goals
    await tx.goal.createMany({ data: parsed.goals.map(g => ({ ...g, matchId: parsed.matchId })) })
    // Create cards
    await tx.card.createMany({ data: parsed.cards.map(c => ({ ...c, matchId: parsed.matchId })) })
    // Recalculate standings
    await recalculateCategoryStandings(tx, match.categoryId)
    revalidatePath('/')
  })
}
```

---

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Standings engine (`src/lib/standings.ts`) | Pure function tests: win/draw/loss/tiebreakers/edge cases. Vitest or Node assert |
| Unit | Zod validation schemas | Test each schema: valid input passes, invalid rejects, edge cases (empty strings, negatives) |
| Integration | Auth middleware (`src/middleware.ts`) | Mock session, test redirect/allow logic for `/admin/*` |
| Integration | Server Actions | Test success path + validation failures + auth guard (via Vitest + Prisma test DB or mocked) |
| E2E | Full CRUD flows | Manual testing via browser during dev. Consider Playwright for critical paths (login → create match → standings update) |

**Note**: Strict TDD is disabled per config. Focus testing effort on the standings engine (most complex logic) and form validation (user-facing correctness).

---

## Open Questions

- [ ] Card accumulation suspension rules: should 5 yellows = auto-suspension? Spec says "configurable" — defer to a settings model or env var in a follow-up.
- [ ] Walkover/forfeit scoring: spec mentions 1-0 but says "configurable". Implement as 1-0 default, revisit if config needed.
- [ ] League deletion with cascade: schema uses `onDelete: Restrict` for most FKs. Do we want soft-delete instead? Design assumes hard-delete with restrict.
