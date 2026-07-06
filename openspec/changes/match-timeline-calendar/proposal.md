# Proposal: Match Timeline & Calendar

## Intent

Users need to see a detailed timeline of events per match and a calendar overview of scheduled/finished matches. Currently, the matches list page shows compact cards with inline goals/cards — no dedicated detail page or calendar navigation.

## Scope

### In Scope
- Match detail page (`/matches/[id]`): header, vertical timeline of goals/cards, stats summary, team page links
- Match calendar view (`/matches/calendar`): date grid with match cards, category filter, status color-coding
- Integration: match cards link to detail page; tab/switch on /matches page

### Out of Scope
- Admin-side match detail (admin has separate views)
- Edit/delete match actions from detail page
- Photo/media upload per match
- Comments, fan voting, or match ratings
- Print/PDF export of match report

## Capabilities

### New Capabilities
- `public-match-detail`: Read-only match detail page with event timeline and stats summary
- `match-calendar`: Calendar grid view of matches with filtering and status display

### Modified Capabilities
None.

## Approach

1. Create `src/app/(public)/matches/[id]/page.tsx` — server component fetching match + goals + cards with full player/team relations, rendering a vertical timeline
2. Create `src/app/(public)/matches/calendar/page.tsx` — server component with category filter, grouping matches by date, rendering a calendar grid
3. Update existing `(public)/matches/page.tsx` — wrap match cards in `<Link href="/matches/{id}">`, add calendar/list toggle
4. Build reusable `MatchTimeline` and `CalendarGrid` components in `src/components/public/`

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/(public)/matches/[id]/page.tsx` | New | Match detail with timeline |
| `src/app/(public)/matches/calendar/page.tsx` | New | Calendar grid view |
| `src/components/public/match-timeline.tsx` | New | Vertical timeline component |
| `src/components/public/match-calendar-grid.tsx` | New | Calendar grid component |
| `src/app/(public)/matches/page.tsx` | Modified | Add links to detail page, calendar toggle |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Performance with many matches in calendar | Low | Limit visible range; paginate by week |
| Playing match shows incomplete timeline | Low | Handle missing goals/cards gracefully |

## Rollback Plan

Revert the modified matches list page and delete the 3 new route and component files. Layout is unchanged — no visual breakage.

## Dependencies

None.

## Success Criteria

- [ ] `/matches/[id]` renders header with teams, score, category, date/time, court
- [ ] Timeline shows goals, yellow cards, red cards, own goals, and second-yellow-reds ordered by minute
- [ ] `/matches/calendar` shows matches in a date grid with correct status colors (SCHEDULED/PLAYING/FINISHED)
- [ ] Category filter works on calendar view
- [ ] Match cards on list page link to `/matches/[id]`
- [ ] Calendar/list tab switch works on /matches page
- [ ] App builds without errors
