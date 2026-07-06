# Player Management Specification

## Purpose

Manage player registration within a team. Players have identity data (name, surname, national ID) and match-related attributes (jersey number, active status). Admin-only CRUD.

## Requirements

### Requirement: Player CRUD

The system MUST support create, read, update, and delete player records.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes | First name |
| surname | string | yes | Last name |
| dni | string | yes | National ID, unique |
| birth_date | date | yes | Player date of birth |
| photo_url | string | no | Player photo |
| team_id | UUID | yes | Foreign key to Team |
| jersey_number | integer | no | Squad number |
| is_active | boolean | no | Default: true |

#### Scenario: Admin registers a player

- GIVEN an authenticated admin and an existing team
- WHEN the admin creates a player with name "Juan", surname "Pérez", dni "12345678", birth_date "2010-05-10"
- THEN the player is persisted under that team with `is_active: true`

#### Scenario: Admin deactivates a player

- GIVEN an existing active player
- WHEN the admin sets `is_active` to false
- THEN the player is marked inactive
- AND the player no longer appears in active player lists

### Requirement: DNI uniqueness

Player DNI MUST be unique across the entire system.

#### Scenario: Duplicate DNI rejected

- GIVEN an existing player with dni "12345678"
- WHEN the admin creates another player with the same dni "12345678"
- THEN the system MUST reject with a duplicate DNI error

### Requirement: Player-team relationship

A player MUST belong to exactly one team at a time.

#### Scenario: Reassign player to a new team

- GIVEN a player assigned to team A
- WHEN the admin updates the player's team to team B
- THEN the player is now associated with team B
