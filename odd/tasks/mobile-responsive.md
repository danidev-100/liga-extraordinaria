# Mobile responsive — whole app

Make Torneo Pro fully usable on mobile (320–430 px) across public, admin and auth surfaces, without changing the desktop appearance or business behavior.

## Specs

- **S1** — User request (verbatim): "quiero que sea totalmente resposive para movil". Scope: every surface of the app (public site, league pages, admin dashboard, auth) and every shared primitive they use.
- **S2** — At viewport widths 320, 375, 390 and 430 px no page has horizontal document overflow (`document.documentElement.scrollWidth <= window.innerWidth`). A table may scroll inside its own container, never the page.
- **S3** — Mobile navigation works: public header menu and admin sidebar open from a ≥44×44 px target, stay inside the viewport (`max-width: 85vw`), scroll internally, close on navigation/Esc, and do not hide page content behind them.
- **S4** — Content fits the viewport: page titles wrap, stat grids reflow, cards/charts/headers never clip or overflow their container.
- **S5** — Tables stay readable: non-essential columns are hidden below `sm`/`md`, essential text is not clipped, and the table container scrolls horizontally where a full table cannot fit.
- **S6** — Forms and dialogs are usable: fields stack at full width, dialogs never exceed the viewport height and scroll internally, action rows wrap.
- **S7** — Desktop appearance is unchanged at ≥1024 px, and existing print/PDF contracts still work (`.overflow-x-auto` wrappers used by print rules keep their class names).

## Tasks

| ID | Specs | Route | Description | Commit |
| --- | --- | --- | --- | --- |
| T1 | S4,S5,S6 | inline | Shared primitives: chart card height, dialog max-height/scroll, data-table pagination wrap, table cell density | `feat: make shared UI primitives mobile friendly` |
| T2 | S3,S4 | writer | Public shell, landing header, league home and auth pages | `feat: make public shell and auth pages responsive` |
| T3 | S3 | writer | Admin shell and sidebar navigation | `feat: make admin shell responsive` |
| T4 | S5 | writer | Tables: standings, tarjetas, goleadores, vallas, admin standings and admin list tables (players, teams, leagues, categories, courts, admins) | `feat: make tables responsive on mobile` |
| T5 | S4,S6 | writer | Match cards, schedule views, match/result forms and dialogs | `feat: make match views and forms responsive` |
| T6 | S4,S5 | writer | Charts and team/player detail pages | `feat: make charts and detail pages responsive` |
| T7 | S2–S7 | parent | Browser sweep at 320/375/390/430 px + desktop regression at 1280 px | — |
| T8 | all | parent | Close: report outcome and checks | — |

## Log

- **L1** — "quiero que sea totalmente resposive para movil"
- **L2** — Explorer audit found: Tailwind v4 CSS-first, no tailwind config; shared primitives (`ui/table`, `data-table`, `chart-card`, `ui/dialog`) have zero responsive prefixes; admin `main` uses `overflow-x-auto` masking child overflow; public drawer is fixed `w-64`; auth pages use `min-h-screen` + `items-center`.
- **L3** — Verification tooling: no Playwright in the project, but global `playwright-cli` with Chromium is available for 390 px screenshots and overflow checks.
- **L4** — Browser baseline at 320 px (public + admin, logged in as `admin@liga.com`): no document-level horizontal overflow, but admin match cards squeeze team names against 5 action buttons and admin data-tables (players) clip columns inside their own scroll area. T4 widened to cover all non-match admin list tables; T5 owns match cards and forms.
- **L5** — T7 saturation sweep: 34 routes × 320/375/390/430 px = 136 loads, zero document-level horizontal overflow. Flagged elements were only decorative off-canvas circles inside `overflow-hidden` heroes and absolutely positioned wrappers. Follow-up: clipped-content pass over `overflow:hidden` containers at 390 px, plus visual screenshots of key screens.
