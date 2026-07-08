# Delta for Admin Authentication

## ADDED Requirements

### Requirement: Self-registration flow

The system MUST provide a public registration page at `/register` where new users create their account. Registration creates an Admin record with `leagueId: null` and redirects to league creation. (Detailed spec in `public-registration`.)

### Requirement: Session includes leagueId

The JWT and session MUST include `leagueId` and `role` to enable query scoping in all admin actions.

#### Scenario: LeagueId in JWT

- GIVEN an authenticated Admin with a league
- WHEN the session JWT is decoded
- THEN it contains fields: `id`, `email`, `name`, `role`, `leagueId`

#### Scenario: Admin without league

- GIVEN an Admin who registered but has not created a league (leagueId: null)
- WHEN they access any `/admin/*` route
- THEN they are redirected to `/create-league`

## MODIFIED Requirements

### Requirement: Login with email + password

The system MUST authenticate an admin using a registered email and password via Auth.js v5 Credentials provider. The resulting session MUST include `leagueId`.

| Field | Type | Constraint |
|-------|------|-----------|
| email | string | Valid email format, unique |
| password | string | Min 8 chars, hashed with bcrypt |
| leagueId | UUID/null | In session, from Admin record |

(Previously: No leagueId in session. Login redirected to `/admin/dashboard`.)

#### Scenario: Successful login

- GIVEN an admin with email `admin@liga.com` and a valid password, associated with league "league-a"
- WHEN the admin submits the login form with correct credentials
- THEN the system creates a session with `leagueId: "league-a"`
- AND redirects to `/admin`

#### Scenario: Invalid credentials

- GIVEN an admin with email `admin@liga.com` and password `wrongpass`
- WHEN the admin submits the login form with incorrect password
- THEN the system returns a generic "Invalid credentials" error
- AND the system MUST NOT reveal whether the email exists

### Requirement: Admin route protection

The system MUST protect all `/admin/*` routes via Next.js middleware, redirecting unauthenticated users to `/login`. Authenticated users without a `leagueId` SHALL be redirected to `/create-league`.

(Previously: Redirected to `/login` only. No leagueId check.)

#### Scenario: Unauthenticated access blocked

- GIVEN an unauthenticated user
- WHEN the user navigates to `/admin/players`
- THEN the system redirects to `/login`

#### Scenario: Authenticated without league redirected

- GIVEN an authenticated Admin with `leagueId: null`
- WHEN the admin navigates to `/admin/players`
- THEN the system redirects to `/create-league`

#### Scenario: Authenticated with league allowed

- GIVEN an authenticated admin session with role `ADMIN` and `leagueId` set
- WHEN the admin navigates to `/admin/players`
- THEN the system renders the admin page

### Requirement: Role-based guard

The system SHALL use a role enum (`ADMIN` | `SUPER_ADMIN`). `SUPER_ADMIN` bypasses league scoping and sees all data.

(Previously: Only `ADMIN` and `manager` roles. No SUPER_ADMIN bypass.)

#### Scenario: Extensible role check

- GIVEN a role field defined as an enum with value `ADMIN`
- WHEN the system checks authorization on a protected route
- THEN it MUST verify the role satisfies the route's minimum role level

#### Scenario: SUPER_ADMIN bypasses league scope

- GIVEN a `SUPER_ADMIN` with `leagueId: null`
- WHEN they access any admin page
- THEN `ensureScope()` returns true (no filter)
- AND they can view/edit data for any league
