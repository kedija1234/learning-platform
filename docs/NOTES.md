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

### Known Limitations
- **Open Registration for Privileged Roles**: The platform currently permits self-registration with the `mentor` and `coordinator` roles to simplify local demonstration and evaluation. In a production educational institution environment, self-registration would typically be restricted to students, while mentor and coordinator roles would require administrative invitations, academic department approval, or email domain verification workflows.

---

## Phase 3: Courses, Resources, Assignments & Enrollments

### What Was Built
1. **Feature-Based Architecture (`backend/src/features/courses/`)**:
   - `courses.validation.js`: Input schemas for course creation, learning resources, assignments with due dates, integer route params (`:id`, `:resourceId`, `:assignmentId`), and pagination query parameters (`page`, `limit`, `search`).
   - `courses.service.js`: Complete business logic layer:
     - `listCourses`: Paginated course listing with keyword search across `title` and `description` using `LIKE`. Includes total enrolled students count and mentor names.
     - `getCourseById`: Returns detailed course record, attached resources, assignments (ordered by due date), and current viewer's enrollment status and `progress_percent`.
     - `createCourse`: Restricts course creation to mentors/admins; assigns ownership.
     - `updateCourse` & `deleteCourse`: Restricts modifications to owning mentors or administrators. Cascades delete to enrollments, resources, and assignments.
     - `addResource` & `deleteResource`: Allows owning mentor to attach/detach learning materials and links.
     - `addAssignment` & `deleteAssignment`: Allows owning mentor to post assignments with instructions and MySQL-compatible due dates.
     - `enrollStudent`: Enrolls students with initial 0% progress; prevents duplicate enrollments with 409 Conflict.
     - `getEnrolledCourses`: Returns paginated courses enrolled by the authenticated student.
     - `getCourseStudents`: Allows owning mentors to view enrolled students and their progress.
   - `courses.controller.js`: HTTP handlers mapping request parameters to service operations with standard JSON responses.
   - `courses.routes.js`: Express router mounting 12 endpoints protected with `authenticateToken` and `requireRole`.

2. **TiDB Cloud Compatibility**:
   - Pagination bounds (`safeLimit` and `safeOffset`) are strictly validated and clamped integers interpolated directly into the query, adhering to TiDB's restriction against `LIMIT ?` and `OFFSET ?` placeholders.
   - Search queries use standard SQL `LIKE %term%` rather than unsupported `FULLTEXT` indexes.
   - Foreign keys use `ON DELETE CASCADE` for automated referential cleanup.

3. **Multi-Suite Test Runner (`backend/tests/runner.js`)**:
   - Automatically discovers all `*.test.js` files in `backend/tests/`.
   - Executes each suite in an isolated Node process with clean stdio and environment inheritance, eliminating connection pool collision and cross-file state leakage.

4. **Automated Test Suite (`backend/tests/courses.test.js`)**:
   - 21 automated test cases verifying:
     - Mentor course creation (201)
     - Student course creation rejection (403)
     - Course listing with pagination metadata (200)
     - Keyword search filtering (200)
     - Owning mentor adding resource (201)
     - Non-owning mentor resource rejection (403)
     - Owning mentor adding assignment (201)
     - Non-owning mentor assignment rejection (403)
     - Student course enrollment (201)
     - Duplicate enrollment rejection (409)
     - Mentor enrollment rejection (403)
     - Student enrolled courses list (200)
     - Detailed course inspection with resources and enrollment flag (200)
     - Owning mentor viewing enrolled students list (200)
     - Non-owning mentor student list rejection (403)
     - Course updates (200)
     - Resource deletion (200)
     - Assignment deletion (200)
     - Non-owning mentor course deletion rejection (403)
     - Owning mentor course deletion (200)

### Key Technical Decisions
- **Ownership Verification Helper**: Created `verifyCourseOwnership` to enforce that only the course's creator or an administrator can add resources, add assignments, view student progress, update, or delete the course.
- **Route Specificity Order**: Mounted `/api/courses/enrolled/me` before `/api/courses/:id` in `courses.routes.js` to prevent Express from treating the literal string `'enrolled'` as a numeric `:id` parameter.
- **DATETIME Formatting**: Formatted JavaScript ISO date strings into standard SQL `YYYY-MM-DD HH:MM:SS` format prior to insertion into MySQL/TiDB `DATETIME` columns.

### Problems Found and How They Were Fixed
- **Issue**: Attempting to insert an ISO 8601 string with UTC indicator (e.g. `'2026-10-27T20:12:17.148Z'`) into MySQL's `DATETIME` column caused an `ER_TRUNCATED_WRONG_VALUE` error (code 1292).
  - **Fix**: Added a date normalization step in `courses.service.js` converting ISO date strings to `'YYYY-MM-DD HH:MM:SS'` before executing the insert.
- **Issue**: Running test suites concurrently in a single process caused the first suite's `after()` hook (`pool.end()`) to prematurely terminate active sockets used by the second suite.
  - **Fix**: Created `backend/tests/runner.js` to execute test suites sequentially in dedicated child processes, ensuring clean event loop termination and total isolation.

---

## Phase 4: Submissions, Grading & Progress Tracking

### What Was Built
1. **Feature-Based Architecture (`backend/src/features/submissions/`)**:
   - `submissions.validation.js`: Input schemas for submitting work (`content` required), grading (`grade` 0–100 float, optional `feedback`), paginated query params (`page`, `limit`, `courseId`), and numeric ID path params.
   - `submissions.service.js`: Complete business logic layer:
     - `submitAssignment`: Checks assignment exists → checks student is enrolled → guards against resubmission after grading → upserts the submission row (insert on first submit, update on resubmit before grading) → calls `updateCourseProgress`.
     - `updateCourseProgress`: Counts submitted distinct assignments vs total assignments in the course and writes the resulting percentage (0–100) back to `enrollments.progress_percent`.
     - `getSubmissionById`: Role-aware access control — students see only their own; mentors see only submissions in courses they own; admins see all.
     - `getStudentSubmissionForAssignment`: Returns a single student's submission for one assignment (or `null` if not yet submitted).
     - `getAssignmentSubmissions`: Mentor/admin paginated view of all submissions for an assignment, with student profile data joined in.
     - `getStudentSubmissions`: Student's own submission history across all courses (or filtered by `courseId`), paginated.
     - `gradeSubmission`: Mentor/admin only; verifies course ownership; updates `grade` and `feedback`; recalculates course progress.
   - `submissions.controller.js`: Thin HTTP layer mapping `req.params`/`req.body`/`req.user` to service calls with standardised JSON responses.
   - `submissions.routes.js`: Exports **two routers**:
     - `submissionsRouter` — mounted at `/api/submissions` (`GET /me`, `GET /:id`, `PUT /:id/grade`)
     - `assignmentSubmissionsRouter` — mounted at `/api/assignments` (`POST /:assignmentId/submissions`, `GET /:assignmentId/submissions/me`, `GET /:assignmentId/submissions`)

2. **App Wiring (`backend/src/app.js`)**:
   - Both routers imported and mounted: `/api/submissions` and `/api/assignments`.

3. **Automated Test Suite (`backend/tests/submissions.test.js`)**:
   - 16 test cases covering the complete workflow in order:
     - Non-enrolled student blocked from submitting (403)
     - Enrolled student submits work (201)
     - Resubmission before grading updates content in-place, returns same `id` (201)
     - `progress_percent` reaches 100% after submitting the only assignment
     - Student views own submission (200)
     - Another student blocked from viewing (403)
     - Non-owning mentor blocked from listing submissions (403)
     - Owning mentor lists all submissions with pagination (200)
     - Grade above 100 rejected (400)
     - Negative grade rejected (400)
     - Student forbidden from grading (403)
     - Owning mentor grades submission (200)
     - Student cannot resubmit after grading (400)
     - Student views submission with populated grade and feedback (200)
     - Student views full submission history across courses (200)
     - Student retrieves their submission for a specific assignment (200)

### Key Technical Decisions
- **Upsert Logic for Resubmission**: Rather than blocking all resubmissions, the service allows a student to update their content right up until a mentor grades it. Once `grade IS NOT NULL` the row is locked. This is a common real-world pattern — students can fix typos or add content before feedback arrives.
- **Two Routers, One Feature File**: Submission endpoints logically belong to two URL namespaces (`/api/submissions` and `/api/assignments`). Both routers are exported from one file and mounted separately in `app.js`, keeping the feature self-contained without duplicating middleware wiring.
- **Progress as a Derived Calculation**: `progress_percent` is not stored as a raw counter — it is always recomputed from the actual submission rows. This prevents the counter from drifting out of sync if assignments are added or deleted later.
- **Role-Layered Access Control in the Service**: Access control is enforced inside the service (not just on the route), which means the rules are unit-testable and cannot be bypassed by mounting the same controller under a different route.

### Problems Found and How They Were Fixed
- **Issue**: MySQL `DECIMAL` columns (used for `grade`) are returned as strings (e.g. `"88.00"`) by `mysql2`, causing `assert.equal(grade, 88)` to fail with strict equality.
  - **Fix**: Wrapped grade assertions in `Number()` — `assert.equal(Number(body.data?.submission?.grade), 88)` — so the test is robust regardless of MySQL's type coercion.

### Test Results
```
auth.test.js        13 tests  ✔ 13 pass  ✘ 0 fail
courses.test.js     21 tests  ✔ 21 pass  ✘ 0 fail
submissions.test.js 16 tests  ✔ 16 pass  ✘ 0 fail
─────────────────────────────────────────────────────
TOTAL               50 tests  ✔ 50 pass  ✘ 0 fail
```
