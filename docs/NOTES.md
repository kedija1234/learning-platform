# Project Engineering Notes & Architecture Log

Brolf Tech Remote Internship Challenge 2026 — Project 4 (Full Stack Track)
Platform: University Learning & Internship Platform

---

## Phase 1: Setup, Backend Skeleton, Database Configuration & Core Schema

### What Was Built
1. **Repository Layout**:
   - Monorepo structure with `backend/`, `frontend/`, and `docs/`.
   - `.gitignore` properly configured and verified for security (strictly ignoring `.env`, `node_modules/`, `uploads/`, and `*.log`).
   - Configured `frontend/vercel.json` with SPA route rewrites for subsequent frontend deployment.

2. **Backend Foundation**:
   - Node.js project using ES Modules (`"type": "module"`) and Express 5.
   - Dependencies: `express@5`, `mysql2/promise`, `dotenv`, `cors`, `bcryptjs`, `jsonwebtoken`, `express-validator`, `multer`, `pdf-parse`.
   - Environment configuration templates (`backend/.env.example` and `frontend/.env.example`) containing only placeholders—no real credentials committed.
   - Centralized error-handling middleware (`errorHandler.js`) and 404 handler (`notFoundHandler.js`).
   - Server entry point (`server.js`) with fallback to port 5000 and startup database connectivity check.
   - Health check route (`GET /api/health`) reporting system status, uptime, and database latency.

3. **Database Architecture & TiDB Cloud Compatibility**:
   - `backend/db/schema.sql` implementing the 9 core tables:
     - `users`: Includes `role` (`student`, `mentor`, `coordinator`, `admin`) and `is_active`.
     - `courses`: Mentors create courses.
     - `enrollments`: Unique per student and course; tracks `progress_percent`.
     - `resources`: Course links and reference texts.
     - `assignments`: Course assignments with due dates.
     - `submissions`: Student submissions with grades and feedback.
     - `internships`: Opportunities posted by coordinators.
     - `applications`: Unique per student and internship with status tracking (`pending`, `accepted`, `rejected`).
     - `notifications`: Alerts for role-specific events with `is_read` flag.
   - All tables created with `CREATE TABLE IF NOT EXISTS` and explicit `ON DELETE CASCADE` foreign keys.
   - Standard B-Tree indexes added on all foreign keys and search columns; avoided `FULLTEXT` indexes to maintain full compatibility with TiDB Cloud.
   - Avoided relying on SQL `CHECK` constraints (constraints will be enforced in application logic).

4. **Database Scripts**:
   - `backend/db/initDb.js`: Connects to MySQL, creates the database if not present, and executes `schema.sql` without dropping or overwriting existing data.
   - `backend/db/seedDb.js`: Populates sample users for each role, sample courses, resources, assignments, enrollments, and internships.
   - Refusal Guard: The seed script immediately halts and refuses to run if `DB_SSL=true` to protect remote/production environments.

> [!NOTE]
> **Seed Account Credentials (FOR LOCAL TESTING ONLY)**
> The seed script populates test accounts with password `Password123!` (hashed via bcrypt):
> - Admin: `admin@platform.edu`
> - Coordinator: `coordinator@platform.edu`
> - Mentor: `mentor@platform.edu`
> - Student: `student@platform.edu`
> These accounts and passwords are for local development and demonstration only.

### Key Technical Decisions
- **Express 5**: Express 5 has native promise rejection handling in route handlers, eliminating the need for boilerplate `try/catch` or wrapper libraries like `express-async-errors`.
- **Database Connection Pool**: Configured `mysql2/promise` with connection pooling (`connectionLimit: 10`) for reuse across requests.
- **TiDB Cloud TLS Handling**: When `DB_SSL=true`, the pool and runner automatically configure `{ ssl: { rejectUnauthorized: false } }` to support secure TLS handshakes without custom CA certificate paths.
- **Data Protection**: `schema.sql` contains no `DROP TABLE` statements, preventing accidental data wipes when running `npm run db:init`.

### Problems Found and How They Were Fixed
- **Issue**: Checking package versions over network timed out due to npm registry latency.
  - **Fix**: Pinned standard, stable release tags directly in `package.json` (`express@^5.0.0`, `mysql2@^3.11.0`, etc.) and ran `npm install`.
- **Issue**: MySQL seed script running against live or staging databases could contaminate production records.
  - **Fix**: Added a guard in `backend/db/seedDb.js` that inspects `DB_SSL === 'true'` and aborts execution with a clear security alert.
- **Issue**: Initial `npm install` stalled due to local network proxy/antivirus SSL inspection (`UNABLE_TO_VERIFY_LEAF_SIGNATURE`).
  - **Fix**: Ran `npm install --strict-ssl=false` allowing package download through the local inspection layer, and committed `package-lock.json`.
- **Issue**: `connection.changeUser({ database })` failed with `Access denied (using password: NO)` in `initDb.js` because `changeUser` resets authentication credentials if omitted.
  - **Fix**: Replaced `changeUser` with standard SQL `await connection.query('USE ...')` maintaining the authenticated session.

---

## Phase 2: Authentication & Authorization (Register, Login, JWT, Roles, /me, Tests)

### What Was Built
1. **Feature-Based Architecture**:
   - Organized backend code under `backend/src/features/auth/`:
     - `auth.validation.js`: Declarative validation schemas using `express-validator` for `register` and `login`.
     - `auth.service.js`: Isolated business logic and database interactions (user creation, password hashing, JWT signing, password verification, active account checks).
     - `auth.controller.js`: Clean HTTP controllers delegating to service and returning standardized JSON envelopes.
     - `auth.routes.js`: Express router chaining validation, error verification, authentication, and controllers.

2. **Middleware**:
   - `validateRequest` (`src/middleware/validate.js`): Intercepts express-validator errors and returns standardized 400 Bad Request responses with field-level error messages.
   - `authenticateToken` (`src/middleware/auth.js`): Verifies JWT Bearer tokens from the `Authorization` header and attaches the decoded user (`id`, `email`, `role`) to `req.user`.
   - `requireRole(...allowedRoles)` (`src/middleware/auth.js`): Role-based access control checking whether `req.user.role` matches allowed roles, returning 403 Forbidden with clear diagnostic information when unauthorized.

3. **Authentication Endpoints**:
   - `POST /api/auth/register`: Creates new accounts (`student`, `mentor`, `coordinator`). Hashes password with bcrypt (10 rounds), ensures lowercase email uniqueness, and immediately returns a signed JWT with user profile. Prevents self-registration as `admin`.
   - `POST /api/auth/login`: Validates credentials, checks if account `is_active` (returns 403 if deactivated), verifies bcrypt hash, and issues a JWT token.
   - `GET /api/auth/me`: Protected route returning the current user's profile (excluding sensitive `password_hash`).
   - `GET /api/auth/role-check`: Protected route verifying role-based authorization rules.

4. **Automated Testing**:
   - Created full test suite in `backend/tests/auth.test.js` using Node.js 24 native test runner (`node:test` and `node:assert/strict`).
   - 13 comprehensive automated test cases covering:
     - Student registration (201)
     - Mentor registration (201)
     - Duplicate email rejection (409)
     - Short password rejection (400)
     - Invalid email rejection (400)
     - Successful login (200)
     - Wrong password rejection (401)
     - Non-existent user rejection (401)
     - Protected `/me` access with valid token (200)
     - Missing token rejection (401)
     - Malformed/invalid token rejection (401)
     - Student role denial on mentor route (403)
     - Mentor role access on mentor route (200)

### Key Technical Decisions
- **Feature-Based Code Organization**: Grouping `routes`, `controller`, `service`, and `validation` by feature makes each module self-contained, easy to navigate, and modular as the application expands.
- **Service Layer Separation**: Keeping SQL queries and hashing logic in `auth.service.js` keeps controllers thin and simplifies unit/integration testing.
- **Role Enforcement & Security**: Public registration only permits `student`, `mentor`, and `coordinator`. Admin accounts cannot be self-registered and are restricted to system initialization or administrative promotion.
- **Native Test Runner (`node:test`)**: Leveraging Node.js 24 built-in test runner eliminates external testing dependencies, supports native ES modules seamlessly, and runs the entire auth test suite in under 1 second.
- **Security Semantics**: Generic error messages on login (`Invalid email or password`) prevent user enumeration attacks.

### Problems Found and How They Were Fixed
- **Issue**: Attempting to dynamically register a test route on `app` after importing `app.js` caused tests to receive 404 because `app.use(notFoundHandler)` was already positioned at the end of the middleware pipeline.
  - **Fix**: Positioned the role verification endpoint (`/api/auth/role-check`) directly in `auth.routes.js`, ensuring proper routing order and allowing end-to-end testing of `authenticateToken` and `requireRole`.
- **Issue**: Expected client error test cases (e.g. 409 Conflict, 401 Unauthorized) were logging full error stacks to console output during test runs.
  - **Fix**: Updated `errorHandler.js` to distinguish between 4xx client errors (concise logging, suppressed in test mode) and 500+ server errors (full stack logging for diagnosis).
