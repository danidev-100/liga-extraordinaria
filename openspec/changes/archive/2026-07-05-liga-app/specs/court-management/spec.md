# Court Management Specification

## Purpose

Manage courts/fields where matches are played. Courts have location data and capacity. Each court hosts at most one match at any given time. Admin-only CRUD.

## Requirements

### Requirement: Court CRUD

The system MUST support create, read, update, and delete court records.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes | Court name or number |
| address | string | no | Street address |
| city | string | yes | City location |
| capacity | integer | no | Spectator capacity |

#### Scenario: Admin creates a court

- GIVEN an authenticated admin
- WHEN the admin creates a court "Cancha Central" in city "Buenos Aires"
- THEN the court is persisted

#### Scenario: Admin updates court info

- GIVEN an existing court with address null
- WHEN the admin sets address to "Av. Libertador 1234"
- THEN the address is updated

#### Scenario: Admin deletes a court

- GIVEN a court with no scheduled matches
- WHEN the admin deletes the court
- THEN the court is removed

#### Scenario: Delete court with scheduled matches rejected

- GIVEN a court that has future scheduled matches
- WHEN the admin tries to delete the court
- THEN the system MUST reject the deletion

### Requirement: No double-booking

The system MUST prevent scheduling two matches on the same court at overlapping times.

#### Scenario: Court conflict detected

- GIVEN court "Cancha Central" already has a match scheduled on 2026-07-10 at 15:00
- WHEN the admin schedules another match on the same court on 2026-07-10 at 15:00
- THEN the system MUST reject with a scheduling conflict error

#### Scenario: Same court, different time allowed

- GIVEN court "Cancha Central" has a match at 15:00
- WHEN the admin schedules a match at 17:00 on the same day and court
- THEN the scheduling succeeds
