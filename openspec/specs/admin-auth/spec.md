# Admin Authentication Specification

## Purpose

Authenticate administrators via email and password, manage sessions via Auth.js v5, and protect admin routes with role-based middleware. Designed for a single-role (`admin`) model that is extensible to additional roles.

## Requirements

### Requirement: Login with email + password

The system MUST authenticate an admin using a registered email and password via Auth.js v5 Credentials provider.

| Field | Type | Constraint |
|-------|------|-----------|
| email | string | Valid email format, unique |
| password | string | Min 8 chars, hashed with bcrypt |

#### Scenario: Successful login

- GIVEN an admin with email `admin@liga.com` and a valid password
- WHEN the admin submits the login form with correct credentials
- THEN the system creates a session and redirects to `/admin/dashboard`

#### Scenario: Invalid credentials

- GIVEN an admin with email `admin@liga.com` and password `wrongpass`
- WHEN the admin submits the login form with incorrect password
- THEN the system returns a generic "Invalid credentials" error
- AND the system MUST NOT reveal whether the email exists

### Requirement: Session persistence

The system MUST persist the admin session across page refreshes using a JWT stored in an httpOnly cookie.

#### Scenario: Session survives refresh

- GIVEN an authenticated admin session
- WHEN the admin refreshes the browser page
- THEN the session remains valid and the admin stays logged in

#### Scenario: Expired session redirects to login

- GIVEN an expired session (past JWT expiry)
- WHEN the admin navigates to `/admin/dashboard`
- THEN the system redirects to `/login`

### Requirement: Admin route protection

The system MUST protect all `/admin/*` routes via Next.js middleware, redirecting unauthenticated users to `/login`.

#### Scenario: Unauthenticated access blocked

- GIVEN an unauthenticated user
- WHEN the user navigates to `/admin/players`
- THEN the system redirects to `/login`

#### Scenario: Authenticated access allowed

- GIVEN an authenticated admin session with role `admin`
- WHEN the admin navigates to `/admin/players`
- THEN the system renders the admin page

### Requirement: Role-based guard

The system SHALL use a role enum (`admin` | `manager`) for the admin role, not a boolean flag, to allow future role extensions.

#### Scenario: Extensible role check

- GIVEN a role field defined as an enum with value `admin`
- WHEN the system checks authorization on a protected route
- THEN it MUST verify the role satisfies the route's minimum role level
