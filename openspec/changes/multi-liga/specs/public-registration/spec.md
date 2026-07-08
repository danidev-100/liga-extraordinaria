# Public Registration Specification

## Purpose

Allow new users to self-register with email and password. After registration, the user is redirected to create their league. This is the entry point for new league owners.

## Requirements

### Requirement: Self-registration form

The system MUST provide a public registration page at `/register` with fields: name, email, password, confirm password. All fields are required.

| Field | Type | Constraints |
|-------|------|-------------|
| name | string | 2-100 chars |
| email | string | Valid email format, unique across Admin |
| password | string | Min 8 chars, must match confirm |

#### Scenario: Successful registration

- GIVEN an unauthenticated visitor at `/register`
- WHEN the visitor submits valid name "Carlos", email "carlos@example.com", password "Secret123!", and matching confirm
- THEN the system creates an Admin record with role `ADMIN` and `leagueId: null`
- AND the user is authenticated and redirected to `/create-league`

#### Scenario: Duplicate email rejected

- GIVEN an existing Admin with email "carlos@example.com"
- WHEN a visitor submits registration with the same email
- THEN the system returns "Email already registered" error
- AND no Admin record is created

#### Scenario: Weak password rejected

- GIVEN a visitor at `/register`
- WHEN the visitor submits password "short"
- THEN the system returns "Password must be at least 8 characters" error

### Requirement: Registration validation

The system MUST validate registration input on both client and server side before persisting.

#### Scenario: Client-side validation

- GIVEN a visitor with JavaScript enabled
- WHEN the visitor submits mismatched passwords
- THEN the form shows an inline error "Passwords do not match" before any server call

#### Scenario: Server-side re-validation

- GIVEN a malicious request bypassing client validation
- WHEN the server receives an invalid payload (missing name, invalid email)
- THEN the server rejects with 400 Bad Request and field-level errors

### Requirement: Post-registration session

After successful registration, the system MUST create an authenticated session for the new Admin before redirecting.

#### Scenario: Session created on register

- GIVEN a visitor who just registered
- WHEN the registration succeeds
- THEN the system signs in the user automatically (no separate login step)
- THEN the session JWT includes `email`, `name`, `role: ADMIN`, `leagueId: null`
