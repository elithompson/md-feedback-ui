# Feature Specification: User Authentication

**Status:** Draft
**Created:** 2026-03-29

## User Scenarios

### User Story 1 — Registration (Priority: P1)

A new user visits the app and creates an account with their email and password. They receive a confirmation and are immediately logged in.

**Acceptance Scenarios:**
- Given a valid email and password, when the user submits registration, then an account is created and tokens are returned
- Given an already-registered email, when the user submits registration, then a 409 Conflict is returned

### User Story 2 — Login (Priority: P1)

An existing user logs in with their credentials and receives access to protected resources.

**Acceptance Scenarios:**
- Given valid credentials, when the user logs in, then access and refresh tokens are returned
- Given invalid credentials, when the user logs in, then a 401 Unauthorized is returned

## Requirements

### Functional Requirements

- **FR-001:** The system shall accept email and password for registration
- **FR-002:** The system shall validate email format and password strength (min 8 chars)
- **FR-003:** The system shall issue JWT access tokens with 15-minute expiry
- **FR-004:** The system shall issue refresh tokens with 7-day expiry

## Success Criteria

- All acceptance scenarios pass
- No plaintext passwords stored
- Token expiry enforced correctly
