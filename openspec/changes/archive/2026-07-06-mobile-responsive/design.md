# Mobile Responsive — Technical Design

## 1. Architecture Overview

**No architectural changes.** All modifications are purely additive CSS—Tailwind utility classes applied to existing JSX elements. No component structure, data flow, or logic is altered.

The strategy follows three primitives:

| Primitive | Tailwind utilities | Purpose |
|-----------|-------------------|---------|
| Scroll container | `overflow-x-auto` | Enable horizontal scroll on tables that exceed viewport width |
| Conditional visibility | `hidden sm:table-cell` | Hide low-priority columns on narrow viewports |
| Text containment | `truncate`, `max-w-[…]`, `min-w-0`, `flex-wrap`, `gap-3` | Prevent overflow, wrap pills, enlarge touch targets |

**Breakpoint contracts:**

- `sm` (640px) — column visibility gate for TA/TR
- `360px` — content truncation gate on admin list items
- No custom breakpoints; Tailwind defaults only

## 2. Component Tree

```
DataTable (scroll wrapper only)
  └── Used by: [none currently imported — generic utility]

Public pages:
  /standings (page)
    ├── CategorySelector → pills (truncation + wrap)
    └── StandingsTable   → <th>/<td> TA/TR: hidden sm:table-cell
                            └── Already has overflow-x-auto container

  /matches (page)
    └── MatchScheduleFilter → pills (truncation + wrap, identical to CategorySelector)

  /goleadores (page)
    ├── CategorySelector → pills (truncation + wrap)
    └── Raw <Table>      → Already has overflow-x-auto container (no columns to hide)

  /tarjetas (page)
    ├── CategorySelector → pills (truncation + wrap)
    └── Raw <Table>      → Already has overflow-x-auto container (no columns to hide)

Admin pages:
  /admin/standings (page)
    └── Raw <Table>      → <th>/<td> TA/TR: hidden sm:table-cell
                            └── Already has overflow-x-auto container

  /admin/matches/[id] (page)
    └── MatchResultForm  → goal/card rows: gap-3, gap-2 → gap-3

  /admin/teams (page)
    └── List items       → min-w-0 + truncate on content (<360px)

  /admin/players (page)
    └── List items       → min-w-0 + truncate on content (<360px)

  /admin/categories (page)
    └── List items       → min-w-0 + truncate on content (<360px)

  /admin/courts (page)
    └── List items       → min-w-0 + truncate on content (<360px)

  /admin/leagues (page)
    └── List items       → min-w-0 + truncate on content (<360px)
```

## 3. Data Flow

**Unchanged.** All components receive data through the same Server Component data fetching or client-side actions as before. Responsive classes only affect rendering/presentation, never data fetching, sorting, filtering, or mutation.

## 4. Technical Decisions

### 4.1 All changes are existing Tailwind classes

No custom CSS, no CSS modules, no styled-components, no new libraries. Every class used (`overflow-x-auto`, `hidden`, `sm:table-cell`, `truncate`, `max-w-[…]`, `min-w-0`, `flex-wrap`, `gap-3`) is a built-in Tailwind utility.

### 4.2 Native scroll for tables

`overflow-x-auto` relies on the browser's native horizontal scroll. No custom scrollbar styling. No JavaScript scroll helpers. This is the standard, accessible pattern for wide tables on mobile.

### 4.3 Visibility toggle with sm breakpoint

`hidden sm:table-cell` is the correct Tailwind pattern for table cells. `hidden` on its own removes the element from the table layout; `sm:table-cell` restores `display: table-cell` at the `sm` breakpoint. This is equivalent to:

```css
/* Base: hidden */
th.TA, td.TA, th.TR, td.TR { display: none; }

/* ≥640px: visible */
@media (min-width: 640px) {
  th.TA, td.TA, th.TR, td.TR { display: table-cell; }
}
```

### 4.4 Truncation strategy

- **Pills** (CategorySelector, MatchScheduleFilter): `truncate` + `max-w-[160px]` ensures text clips with ellipsis before the pill overflows. `flex-wrap` on the container allows pills to flow to the next row.
- **Admin list items** (<360px): the content column gets `min-w-0` (overrides the default `min-width: auto` on flex items, enabling truncation of children). Text elements inside get `truncate`.

### 4.5 Touch target spacing

- MatchResultForm dynamic rows: change `gap-2` to `gap-3` on the inner grid to increase vertical breathing room between Select/Input fields on mobile.
- The Remove (`X`) button's `mt-6` offset is preserved — it already provides adequate separation from the last form field.

### 4.6 Already-responsive tables

Several pages already have `overflow-x-auto` on their table containers:
- `StandingsTable` (public) — line 56
- `/admin/standings` — line 166
- `/goleadores` — line 149
- `/tarjetas` — line 169

These require **no** scroll-container change. Only TA/TR column hiding (where applicable) and pill/list-item changes are needed.

## 5. File-by-file Changes

### 5.1 DataTable — scroll container

**File**: `src/components/data-table.tsx`

| Element | Change | Justification |
|---------|--------|---------------|
| `<div className="rounded-lg border">` (line 82) | Add `overflow-x-auto` → `rounded-lg border overflow-x-auto` | Tables with 8+ columns overflow on viewports <640px. This enables horizontal scroll while preserving the rounded border. |

**Before**: `<div className="rounded-lg border">`
**After**: `<div className="rounded-lg border overflow-x-auto">`

---

### 5.2 StandingsTable — hide TA/TR columns

**File**: `src/components/public/standings-table.tsx`

| Element | Change | Justification |
|---------|--------|---------------|
| `<TableHead className="w-10 text-center">TA` (line 70) | Add `hidden sm:table-cell` → `hidden sm:table-cell w-10 text-center` | Hide TA header below 640px |
| `<TableHead className="w-10 text-center">TR` (line 71) | Add `hidden sm:table-cell` → `hidden sm:table-cell w-10 text-center` | Hide TR header below 640px |
| TA `<TableCell>` (line 142) | Add `hidden sm:table-cell` | Hide TA cell below 640px |
| TR `<TableCell>` (line 148) | Add `hidden sm:table-cell` | Hide TR cell below 640px |

The table already has `overflow-x-auto` (line 56) — no change needed there.

**Before** (TA header): `<TableHead className="w-10 text-center">TA</TableHead>`
**After**: `<TableHead className="hidden sm:table-cell w-10 text-center">TA</TableHead>`

**Before** (TA cell): `<TableCell className="text-center">`
**After**: `<TableCell className="hidden sm:table-cell text-center">`

Same pattern for TR header and cell.

---

### 5.3 Admin Standings — hide TA/TR columns

**File**: `src/app/(dashboard)/admin/standings/page.tsx`

| Element | Change | Justification |
|---------|--------|---------------|
| TA `<TableHead>` (line 180) | Add `hidden sm:table-cell` | Hide TA header below 640px |
| TR `<TableHead>` (line 181) | Add `hidden sm:table-cell` | Hide TR header below 640px |
| TA `<TableCell>` (line 220) | Add `hidden sm:table-cell` | Hide TA cell below 640px |
| TR `<TableCell>` (line 226) | Add `hidden sm:table-cell` | Hide TR cell below 640px |

The table already has `overflow-x-auto` (line 166) — no change needed there.

Same class pattern as public StandingsTable.

---

### 5.4 CategorySelector — pill truncation

**File**: `src/components/public/category-selector.tsx`

| Element | Change | Justification |
|---------|--------|---------------|
| `<button>` pill (line 54) | Add `max-w-[180px] truncate` to className | Long category names overflow pills on narrow viewports. `truncate` adds `overflow:hidden; text-overflow:ellipsis; white-space:nowrap`. `max-w-[180px]` caps pill width. |
| `<span>` — `cat.league.name` (line 62) | Add `truncate` | League name wraps independently; ensure it also clips if too long. |

The container already has `flex flex-wrap items-center gap-1.5` (line 36) — no container change needed.

**Before** (pill button): `className={cn("rounded-full px-4 py-1.5 text-sm font-medium transition-all", ...)}`
**After**: `className={cn("rounded-full px-4 py-1.5 text-sm font-medium transition-all max-w-[180px] truncate", ...)}`

**Before** (league span): `<span className="text-[11px] opacity-70">`
**After**: `<span className="text-[11px] opacity-70 truncate">`

---

### 5.5 MatchScheduleFilter — pill truncation

**File**: `src/components/public/match-schedule-filter.tsx`

| Element | Change | Justification |
|---------|--------|---------------|
| `<button>` pill (line 48) | Add `max-w-[180px] truncate` | Same as CategorySelector — identical pattern |
| `<span>` — `cat.league.name` (line 56) | Add `truncate` | Same as CategorySelector |

Identical changes to CategorySelector.

---

### 5.6 MatchResultForm — touch spacing on mobile

**File**: `src/components/forms/match-result-form.tsx`

| Element | Change | Justification |
|---------|--------|---------------|
| Goal row inner grid (line 176): `gap-2 sm:grid-cols-4` | Change `gap-2` → `gap-3` | On <640px (single column), `gap-3` provides 12px vertical separation between Select/Input fields — meets minimum touch target clearance. On ≥640px (4 columns), `gap-3` applies horizontally, which is equally comfortable. |
| Card row inner grid (line 327): `gap-2 sm:grid-cols-4` | Change `gap-2` → `gap-3` | Same rationale as goal rows. |

**Before**: `<div className="grid flex-1 gap-2 sm:grid-cols-4">`
**After**: `<div className="grid flex-1 gap-3 sm:grid-cols-4">`

Applied at two locations: line 176 (goal row) and line 327 (card row).

The `<SelectTrigger>` and `<Input>` components from shadcn/ui already meet minimum touch target height (~40px built-in, with `h-10` default) — no additional height classes needed.

---

### 5.7 Admin teams page — content truncation <360px

**File**: `src/app/(dashboard)/admin/teams/page.tsx`

| Element | Change | Justification |
|---------|--------|---------------|
| Content `<div>` (line 86): `flex items-center gap-3` | Add `min-w-0` | Without `min-w-0`, the flex item cannot shrink below its minimum content width, preventing truncation. |
| Name + Badge `<div>` (line 92): `flex items-center gap-2` | Add `min-w-0` | Allows the inner flex row to collapse. |
| `<p className="font-medium">{team.name}</p>` (line 95) | Add `truncate` | Team name truncates with ellipsis before overlapping action buttons. |
| `<p className="text-sm text-muted-foreground">` metadata (line 98) | Add `truncate` | Category + league + player count line also truncates if needed. |

**Before**:
```tsx
<div className="flex items-center gap-3">  {/* content wrapper */}
  …
  <div className="space-y-1">
    <div className="flex items-center gap-2"> {/* name + badge row */}
      <p className="font-medium">{team.name}</p>
      <Badge variant="outline">{team.shortName}</Badge>
    </div>
    <p className="text-sm text-muted-foreground">
      {team.category.name} — …
    </p>
  </div>
</div>
```

**After**:
```tsx
<div className="flex items-center gap-3 min-w-0">  {/* content wrapper */}
  …
  <div className="space-y-1 min-w-0">
    <div className="flex items-center gap-2 min-w-0"> {/* name + badge row */}
      <p className="font-medium truncate">{team.name}</p>
      <Badge variant="outline" className="shrink-0">{team.shortName}</Badge>
    </div>
    <p className="text-sm text-muted-foreground truncate">
      {team.category.name} — …
    </p>
  </div>
</div>
```

**Note**: `<Badge>` and action buttons get `shrink-0` (or are inherently non-shrinkable) to prevent them from collapsing. This is existing behavior for buttons; `shrink-0` is added explicitly to the Badge to ensure it stays visible.

---

### 5.8 Admin players page — content truncation <360px

**File**: `src/app/(dashboard)/admin/players/page.tsx`

| Element | Change | Justification |
|---------|--------|---------------|
| Content `<div>` (line 91): `space-y-1` | Add `min-w-0` | Same pattern as teams. |
| Name row `<div>` (line 92): `flex items-center gap-2` | Add `min-w-0` | Allow inner flex collapse. |
| `<p className="font-medium">{player.name} …</p>` (line 93) | Add `truncate` | Player name truncates before overlapping Edit/Delete. |
| `<p className="text-sm …">` metadata (line 105) | Add `truncate` | DNI + team + category line truncates. |

**Before**:
```tsx
<div className="space-y-1">
  <div className="flex items-center gap-2">
    <p className="font-medium">{player.name} {player.surname}</p>
    …
  </div>
  <p className="text-sm text-muted-foreground">…</p>
</div>
```

**After**:
```tsx
<div className="space-y-1 min-w-0">
  <div className="flex items-center gap-2 min-w-0">
    <p className="font-medium truncate">{player.name} {player.surname}</p>
    …
  </div>
  <p className="text-sm text-muted-foreground truncate">…</p>
</div>
```

Badge items (`<Badge>`) also get `shrink-0` to stay visible.

---

### 5.9 Admin categories page — content truncation <360px

**File**: `src/app/(dashboard)/admin/categories/page.tsx`

| Element | Change | Justification |
|---------|--------|---------------|
| Content `<div>` (line 55): `space-y-1` | Add `min-w-0` | Allow truncation in flex row. |
| `<p className="font-medium">{cat.name}</p>` (line 56) | Add `truncate` | Category name truncates. |
| `<p className="text-sm …">` metadata (line 57) | Add `truncate` | Age range + league + counts truncate. |

---

### 5.10 Admin courts page — content truncation <360px

**File**: `src/app/(dashboard)/admin/courts/page.tsx`

| Element | Change | Justification |
|---------|--------|---------------|
| Content `<div>` (line 51): `space-y-1` | Add `min-w-0` | Allow truncation. |
| `<p className="font-medium">{court.name}</p>` (line 52) | Add `truncate` | Court name truncates. |
| `<p className="text-sm …">` metadata (line 53) | Add `truncate` | City + address + capacity truncate. |

---

### 5.11 Admin leagues page — content truncation <360px

**File**: `src/app/(dashboard)/admin/leagues/page.tsx`

| Element | Change | Justification |
|---------|--------|---------------|
| Content `<div>` (line 54): `space-y-1` | Add `min-w-0` | Allow truncation. |
| Name row `<div>` (line 55): `flex items-center gap-2` | Add `min-w-0` | Allow inner flex collapse. |
| `<p className="font-medium">{league.name}</p>` (line 56) | Add `truncate` | League name truncates. |
| `<p className="text-sm …">` metadata (line 63) | Add `truncate` | Season + dates truncate. |
| `<Badge>` (line 57) | Add `shrink-0` to existing classes | Keep badge visible when name truncates. |

---

## 6. Summary of Changes

| # | File | Lines affected | Class(es) added |
|---|------|---------------|-----------------|
| 1 | `src/components/data-table.tsx` | 82 | `overflow-x-auto` |
| 2 | `src/components/public/standings-table.tsx` | 70, 71, 142, 148 | `hidden sm:table-cell` (4 elements) |
| 3 | `src/app/(dashboard)/admin/standings/page.tsx` | 180, 181, 220, 226 | `hidden sm:table-cell` (4 elements) |
| 4 | `src/components/public/category-selector.tsx` | 54, 62 | `max-w-[180px] truncate` (pill), `truncate` (league) |
| 5 | `src/components/public/match-schedule-filter.tsx` | 48, 56 | `max-w-[180px] truncate` (pill), `truncate` (league) |
| 6 | `src/components/forms/match-result-form.tsx` | 176, 327 | `gap-2` → `gap-3` (2 grids) |
| 7 | `src/app/(dashboard)/admin/teams/page.tsx` | 86, 92, 95, 98 | `min-w-0` × 2, `truncate` × 2, `shrink-0` on Badge |
| 8 | `src/app/(dashboard)/admin/players/page.tsx` | 91, 92, 93, 105 | `min-w-0` × 2, `truncate` × 2 |
| 9 | `src/app/(dashboard)/admin/categories/page.tsx` | 55, 56, 57 | `min-w-0`, `truncate` × 2 |
| 10 | `src/app/(dashboard)/admin/courts/page.tsx` | 51, 52, 53 | `min-w-0`, `truncate` × 2 |
| 11 | `src/app/(dashboard)/admin/leagues/page.tsx` | 54, 55, 56, 63 | `min-w-0` × 2, `truncate` × 2, `shrink-0` on Badge |

**Total: 11 files**, ~25 element changes. All additive. Zero structural refactors.

## 7. Test Plan

### 7.1 Visual verification checklist

| Test | Viewport | What to check |
|------|----------|---------------|
| DataTable with lots of columns | 375px × 812px (iPhone X) | Horizontal scrollbar visible, all column data readable when scrolled |
| StandingsTable TA/TR | <640px (e.g., 375px) | TA and TR columns not rendered in DOM? No — they are `display: none` via CSS. Verify no red/yellow squares visible in last two column positions |
| StandingsTable TA/TR | ≥640px (e.g., 768px) | TA and TR columns visible, squares and counts render correctly |
| Admin Standings TA/TR | <640px and ≥640px | Same as public standings |
| CategorySelector long name | 375px | Pill text truncates with ellipsis, pill does not overflow container |
| CategorySelector multiple pills | 320px | Pills wrap to next line, no horizontal scroll on parent |
| MatchScheduleFilter pills | 375px | Same as CategorySelector |
| MatchResultForm goal row | 375px | Select + Input fields stack vertically with 12px gap, inputs are tappable |
| MatchResultForm card row | 375px | Same as goal row |
| Admin teams list | 320px × 568px (iPhone SE) | Long team name + badge + metadata truncate before hitting action buttons. Edit/Delete buttons remain fully visible and tappable |
| Admin players list | 320px | Player name + badges truncate, action buttons visible |
| Admin categories list | 320px | Category name + metadata truncate |
| Admin courts list | 320px | Court name + city/address truncate |
| Admin leagues list | 320px | League name + season/dates truncate, toggle/edit/delete buttons visible |

### 7.2 Testing procedure

1. Open each page in Chrome DevTools device emulation
2. Set viewport to 375px × 812px (iPhone X)
3. Verify: no content overflows the viewport width
4. Verify: horizontal scroll works on tables
5. Verify: TA/TR columns are hidden (check visually)
6. Resize to 360px × 800px — verify same
7. Resize to 320px × 568px (iPhone SE) — verify admin list items truncate
8. Resize to 768px × 1024px (iPad) — verify TA/TR columns reappear
9. For MatchResultForm: verify form fields are vertically stacked with adequate gaps on both 375px and 320px

### 7.3 Edge cases

- **0 categories**: CategorySelector returns `null` (already handled). No responsive impact.
- **Empty table (0 rows)**: DataTable/StandingsTable show the existing "no results" message. Not affected by responsive classes.
- **Very long league name in pill**: `max-w-[180px] truncate` clips at 180px. If this is too narrow, adjust `max-w` — but 180px on a 375px viewport leaves ~180px for the remaining pills, which is enough for short names + "Todas".
- **Single-character pill text**: No truncation applied. Works as expected.
- **Very short viewport height**: Not addressed by this change — horizontal scroll and vertical stacking are height-agnostic.
