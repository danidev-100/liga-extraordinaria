# Mobile Responsive Specification

## Purpose

Ensure the application UI renders correctly across mobile viewports (320px–768px) by making tables horizontally scrollable, hiding low-priority columns on small screens, truncating pill text, providing adequate touch targets, and preventing content overlap with action buttons on the narrowest devices.

## Requirements

### Requirement: DataTable horizontal scroll

The generic DataTable component MUST render inside a horizontally scrollable container so the table does not overflow its parent on narrow viewports.

#### Scenario: DataTable scrolls on narrow viewport

- GIVEN a DataTable with 8+ columns rendered in a viewport <640px wide
- WHEN the table is displayed
- THEN the table container SHALL have `overflow-x-auto` so the user can scroll horizontally
- AND no column data SHALL be visually clipped or hidden

### Requirement: Standings table hides TA/TR on small viewports

The public StandingsTable MUST hide the TA (yellow cards) and TR (red cards) columns on viewports narrower than 640px.

#### Scenario: TA/TR hidden below 640px

- GIVEN the public standings page on a viewport <640px
- WHEN the StandingsTable renders
- THEN the TA and TR column headers and cells MUST have `hidden sm:table-cell`
- AND all visible columns (Posición, Equipo, Pts, PJ, PG, PE, PP, GF, GC, DG) SHALL render without layout shift

#### Scenario: TA/TR visible on wider viewports

- GIVEN the public standings page on a viewport ≥640px
- WHEN the StandingsTable renders
- THEN the TA and TR columns MUST be visible

### Requirement: Admin Standings hides TA/TR on small viewports

The admin Standings page MUST apply the same column-hiding behavior as the public StandingsTable for viewports <640px.

#### Scenario: Admin standings hides TA/TR

- GIVEN the admin standings page on a viewport <640px
- WHEN the standings table renders
- THEN the TA and TR columns MUST have `hidden sm:table-cell`

### Requirement: CategorySelector pill truncation

The CategorySelector component MUST truncate long category names and league labels so pills do not overflow their container on any viewport.

#### Scenario: Long name truncates

- GIVEN a category with a name exceeding 20 characters
- WHEN the pill renders
- THEN the text SHALL use `truncate` with a `max-w` constraint
- AND the pill SHALL NOT overflow its parent container

#### Scenario: Wrapping on narrow viewport

- GIVEN multiple categories with long names on a viewport <480px
- WHEN the pills render
- THEN they SHALL wrap to the next line without horizontal scroll

### Requirement: MatchScheduleFilter pill truncation

The MatchScheduleFilter component MUST truncate long category names identically to CategorySelector.

#### Scenario: Match schedule pill truncates

- GIVEN a category with a long name in the match schedule filter
- WHEN the pill renders
- THEN the text SHALL use `truncate` with a `max-w` constraint
- AND the pill SHALL NOT overflow its parent container

### Requirement: MatchResultForm touch spacing on mobile

The MatchResultForm MUST provide adequate vertical spacing for dynamic goal and card rows on mobile viewports.

#### Scenario: Goal row touch targets

- GIVEN a MatchResultForm on a viewport <640px
- WHEN a goal row renders
- THEN each field within the row SHALL have minimum vertical gap (`gap-3` or greater) between Select and Input elements
- AND each Select/Input SHALL meet minimum touch target height

#### Scenario: Card row touch targets

- GIVEN a MatchResultForm on a viewport <640px
- WHEN a card row renders
- THEN the row SHALL apply the same spacing rules as goal rows

### Requirement: Admin list items prevent content overlap on <360px

Admin list pages (teams, players, categories, courts, leagues) MUST prevent item content from colliding with action buttons on viewports narrower than 360px.

#### Scenario: Content truncation below 360px

- GIVEN an admin list page on a viewport <360px
- WHEN a list item has a long name, badges, and metadata text
- THEN the content area SHALL truncate text with ellipsis before overlapping the action button group
- AND the action buttons (Edit, Delete) SHALL remain fully visible and tappable

#### Scenario: Teams list with long name and badges

- GIVEN the admin teams page on a viewport <360px
- WHEN a team name plus `shortName` badge plus category metadata exceed available width
- THEN the content SHALL render without pushing buttons off-screen
- AND the metadata line SHALL wrap or truncate independently

## Out of Scope

- Standalone mobile navigation changes (sidebar collapse, hamburger menu, drawer)
- Touch gesture support (swipe, pinch-zoom, drag-to-reorder)
- Responsive layout changes to the sidebar or dashboard shell
- DataTable column visibility toggles
- Print stylesheets or `@media print` rules
- Mobile-specific feature variants (e.g., simplified match input for touch)
- Changes to the desktop layout or breakpoints other than those specified
