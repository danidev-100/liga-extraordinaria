# Tasks: Mobile Responsive — Liga Extraordinaria

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~45–55 (additions only, zero deletions) |
| Files affected | 11 |
| Element changes | ~25 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR — all changes are additive CSS classes |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Phase 1: Implementation

All tasks are CSS-class-only additions. Zero structural refactors. All run in parallel.

### T1 — DataTable horizontal scroll [x]

- **Files**: `src/components/data-table.tsx` (line 82)
- **Change**: Add `overflow-x-auto` to the `<div className="rounded-lg border">` wrapper
- **Deps**: none
- **Risk**: Low
- **AC**: Table container scrolls horizontally on <640px viewport; all column data readable when scrolled

### T2 — Standings TA/TR column hiding (public + admin) [x]

- **Files**:
  - `src/components/public/standings-table.tsx` (lines 70, 71, 142, 148)
  - `src/app/(dashboard)/admin/standings/page.tsx` (lines 180, 181, 220, 226)
- **Change**: Add `hidden sm:table-cell` to TA/TR `<TableHead>` and `<TableCell>` elements (8 total)
- **Deps**: none
- **Risk**: Low
- **AC**: TA/TR columns hidden on <640px, visible on ≥640px; no layout shift on visible columns

### T3 — Pill truncation (CategorySelector + MatchScheduleFilter) [x]

- **Files**:
  - `src/components/public/category-selector.tsx` (lines 54, 62)
  - `src/components/public/match-schedule-filter.tsx` (lines 48, 56)
- **Change**: Add `max-w-[180px] truncate` to pill `<button>`, add `truncate` to league `<span>`
- **Deps**: none
- **Risk**: Low
- **AC**: Long pill text truncates with ellipsis; pills wrap on <480px; no overflow

### T4 — MatchResultForm touch spacing [x]

- **Files**: `src/components/forms/match-result-form.tsx` (lines 176, 327)
- **Change**: Replace `gap-2` with `gap-3` in goal-row and card-row inner grids (2 changes)
- **Deps**: none
- **Risk**: Low
- **AC**: Select/Input fields stack with 12px (gap-3) vertical separation on <640px; touch targets tappable

### T5 — Admin list content truncation (<360px) [x]

- **Files**:
  - `src/app/(dashboard)/admin/teams/page.tsx` (lines 86, 92, 95, 98)
  - `src/app/(dashboard)/admin/players/page.tsx` (lines 91, 92, 93, 105)
  - `src/app/(dashboard)/admin/categories/page.tsx` (lines 55, 56, 57)
  - `src/app/(dashboard)/admin/courts/page.tsx` (lines 51, 52, 53)
  - `src/app/(dashboard)/admin/leagues/page.tsx` (lines 54, 55, 56, 63)
- **Change**: Add `min-w-0` to flex wrappers, `truncate` to text elements, `shrink-0` to badges
- **Deps**: none
- **Risk**: Low
- **AC**: On <360px viewports, item text truncates before colliding with action buttons; buttons remain fully visible and tappable

## Phase 2: Verification

### T6 — Visual verification across viewports

- **Depends on**: T1, T2, T3, T4, T5
- **Risk**: Low
- **AC per spec table §7.1**:
  - [ ] 375px: DataTable scrolls, TA/TR hidden, pills truncate, MatchResultForm gaps adequate
  - [ ] 320px (iPhone SE): admin list items truncate, action buttons visible
  - [ ] 768px (iPad): TA/TR columns reappear
  - [ ] No content overflows viewport width on any checked viewport

## Dependency Graph

```
T1 ─┐
T2 ─┤
T3 ─┤── T6 (verification)
T4 ─┤
T5 ─┘

All implementation tasks (T1–T5) are fully parallel — zero cross-dependencies.
```

## Task Summary

| ID | Description | Files | Deps | Risk |
|----|-------------|-------|------|------|
| T1 | DataTable scroll wrapper | 1 | — | Low |
| T2 | Standings TA/TR hiding | 2 | — | Low |
| T3 | Pill truncation | 2 | — | Low |
| T4 | MatchResultForm touch spacing | 1 | — | Low |
| T5 | Admin list truncation | 5 | — | Low |
| T6 | Visual verification | — | T1–T5 | Low |

Total: 6 tasks (5 implementation + 1 verification), 11 files, ~25 element changes.
