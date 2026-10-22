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
   - Runs against its own ephemeral test server (random port 0) so tests run standalone without requiring a separate server process.
   - 18 test cases covering the complete workflow in order:
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
     - Non-owning mentor forbidden from grading in another mentor's course (403)
     - Owning mentor grades submission (200)
     - Student receives automated notification upon submission grading
     - Student cannot resubmit after grading (400)
     - Student views submission with populated grade and feedback (200)
     - Student views full submission history across courses (200)
     - Student retrieves their submission for a specific assignment (200)

### Key Technical Decisions
- **Late Submission Handling & Due Date Policy**: The system automatically captures `submitted_at` on every submission. Assignments specify an optional `due_date`. Submissions past the due date are permitted rather than hard-blocked, providing mentors with real-world instructional flexibility to review circumstances, accept late assignments, or apply grade deductions with constructive feedback. Both `submitted_at` and `due_date` are stored and returned, allowing frontend clients to render "Late" badges when `submitted_at > due_date`.
- **Automated Notifications on Grading**: Grading an assignment generates an immediate alert in the `notifications` table for the student (`type: 'submission_graded'`), detailing the assignment title, course title, and score received (`X/100`), with direct navigation back to the assignment.
- **Upsert Logic for Resubmission**: Rather than blocking all resubmissions, the service allows a student to update their content right up until a mentor grades it. Once `grade IS NOT NULL` the row is locked. This is a common real-world pattern — students can fix typos or add content before feedback arrives.
- **Two Routers, One Feature File**: Submission endpoints logically belong to two URL namespaces (`/api/submissions` and `/api/assignments`). Both routers are exported from one file and mounted separately in `app.js`, keeping the feature self-contained without duplicating middleware wiring.
- **Progress as a Derived Calculation**: `progress_percent` is not stored as a raw counter — it is always recomputed from the actual submission rows. This prevents the counter from drifting out of sync if assignments are added or deleted later.
- **Role-Layered Access Control in the Service**: Access control is enforced inside the service (not just on the route), which means the rules are unit-testable and cannot be bypassed by mounting the same controller under a different route.

### Problems Found and How They Were Fixed
- **Issue**: MySQL `DECIMAL` columns (used for `grade`) are returned as strings (e.g. `"88.00"`) by `mysql2`, causing `assert.equal(grade, 88)` to fail with strict equality.
  - **Fix**: Wrapped grade assertions in `Number()` — `assert.equal(Number(body.data?.submission?.grade), 88)` — so the test is robust regardless of MySQL's type coercion.
- **Issue**: `submissions.test.js` initially relied on an externally running server at port 5000, causing standalone `npm test` runs to fail if the development server was down.
  - **Fix**: Refactored `submissions.test.js` to bind to port 0 (`app.listen(0)`) in its `before()` hook and close it cleanly in `after()`, matching `auth.test.js` and `courses.test.js`.

### Test Results
```
auth.test.js        13 tests  ✔ 13 pass  ✘ 0 fail
courses.test.js     21 tests  ✔ 21 pass  ✘ 0 fail
submissions.test.js 18 tests  ✔ 18 pass  ✘ 0 fail
─────────────────────────────────────────────────────
TOTAL               52 tests  ✔ 52 pass  ✘ 0 fail
```

---

## Phase 5: Internships & Student Applications

### What Was Built
1. **Feature-Based Architecture (`backend/src/features/internships/`)**:
   - `internships.validation.js`: Input schemas for creating internships (required `title`, `organization_name`, `description`, optional ISO 8601 `deadline`), updating internships, query parameters (`page`, `limit`, `search`), application status updates (`accepted` or `rejected`), and numeric ID path parameters.
   - `internships.service.js`: Complete business logic layer:
     - `listInternships`: Paginated internship opportunities with keyword search across `title`, `organization_name`, and `description` using `LIKE`. Includes application counts and dynamically attaches the authenticated student's current application status (`pending`, `accepted`, `rejected`, or `null`).
     - `getInternshipById`: Detailed internship profile including coordinator contact info and student application state.
     - `createInternship`: Restricted to `coordinator` and `admin` roles. Formats `deadline` into MySQL/TiDB-compatible `YYYY-MM-DD HH:MM:SS`.
     - `updateInternship` & `deleteInternship`: Enforces ownership — only the posting coordinator or an administrator can update or remove the opportunity. Deletion cascades cleanly to applications.
     - `applyToInternship`: Validates internship existence, rejects applications if the deadline has passed (400 Bad Request), prevents duplicate submissions (409 Conflict), records application with initial `pending` status, and triggers an automated notification for the posting coordinator.
     - `getStudentApplications`: Student view of their application history with organization and role details.
     - `getInternshipApplications`: Coordinator view of all applicants for an internship, filterable by application status (`pending`, `accepted`, `rejected`).
     - `updateApplicationStatus`: Coordinator accepts or rejects a student's application, records the decision, and generates an automated notification for the student.
   - `internships.controller.js`: HTTP handlers mapping request parameters to service operations with standard JSON responses.
   - `internships.routes.js`: Express router mounting 9 endpoints protected by `authenticateToken` and `requireRole`.
     - Mounted `/api/internships/applications/me` before `/:id` to avoid route parameter collision.

2. **App Wiring (`backend/src/app.js`)**:
   - Mounted `internshipsRoutes` at `/api/internships`.

3. **Automated Test Suite (`backend/tests/internships.test.js`)**:
   - Self-contained test suite starting its own ephemeral test server (random port 0).
   - 24 automated test cases covering:
     - Coordinator creating internship posting (201)
     - Student forbidden from creating internship (403)
     - Mentor forbidden from creating internship (403)
     - Missing title rejected with 400 Bad Request
     - Browsing internships with pagination metadata (200)
     - Filtering internships by keyword search using `LIKE` (200)
     - Retrieving single internship details by ID (200)
     - Student applying for internship (201)
     - Coordinator receiving notification when student applies (DB check)
     - Duplicate application rejected with 409 Conflict
     - Coordinator forbidden from applying as student (403)
     - Student cannot apply if deadline has passed (400)
     - Student viewing their submitted applications history (200)
     - Non-owning coordinator forbidden from viewing applicants (403)
     - Owning coordinator viewing all applicants (200)
     - Non-owning coordinator forbidden from updating application status (403)
     - Invalid status value rejected with 400 Bad Request
     - Owning coordinator accepting an applicant (200)
     - Student receiving notification when application is accepted (DB check)
     - Owning coordinator rejecting an applicant (200)
     - Student receiving notification when application is rejected (DB check)
     - Non-owning coordinator forbidden from updating internship (403)
     - Owning coordinator updating internship details (200)
     - Non-owning coordinator forbidden from deleting internship (403)
     - Owning coordinator deleting internship (200)

### Key Technical Decisions
- **Bi-Directional Notifications**:
  - When a student applies, the coordinator receives a notification (`type: 'application_received'`) naming the student and the internship title.
  - When a coordinator accepts or rejects an applicant, the student receives a notification (`type: 'application_status_updated'`) with the organization name and the decision (`accepted` or `rejected`).
- **Deadline Enforcement**: Submissions past the deadline date are blocked at application time with a 400 Bad Request error.
- **Route Specificity**: Mounted `/api/internships/applications/me` prior to `/api/internships/:id` to ensure Express resolves the static sub-path before interpreting `applications` as an integer ID parameter.
- **TiDB Cloud Compatibility**:
  - Pagination limits and offsets use safe integer arithmetic interpolated directly into the SQL query (`LIMIT ${safeLimit} OFFSET ${safeOffset}`), strictly avoiding TiDB parameter placeholder restrictions.
  - Search operates via standard SQL `LIKE %term%` rather than unsupported `FULLTEXT` indexes.
  - Deadlines are normalized to `YYYY-MM-DD HH:MM:SS` prior to database insertion.

### Test Results Across All Suites
```
auth.test.js        13 tests  ✔ 13 pass  ✘ 0 fail
courses.test.js     21 tests  ✔ 21 pass  ✘ 0 fail
submissions.test.js 20 tests  ✔ 20 pass  ✘ 0 fail
internships.test.js 24 tests  ✔ 24 pass  ✘ 0 fail
─────────────────────────────────────────────────────
TOTAL               78 tests  ✔ 78 pass  ✘ 0 fail
```

---

## Phase 6: Notifications API & Real-Time Alerts

### What Was Built
1. **Feature-Based Architecture (`backend/src/features/notifications/`)**:
   - `notifications.validation.js`: Input schemas for listing notifications with pagination (`page`, `limit`), unread filtering (`unreadOnly`), and numeric ID path parameters.
   - `notifications.service.js`: Complete business logic layer:
     - `listNotifications`: Retrieves paginated notifications strictly scoped to the authenticated user (`WHERE user_id = ?`). Optionally filters only unread alerts with `unreadOnly=true`. TiDB safe integer interpolation applied for `LIMIT`/`OFFSET`.
     - `getUnreadCount`: Computes real-time unread alert badge count (`WHERE user_id = ? AND is_read = FALSE`).
     - `markAsRead`: Enforces strict data ownership — validates that the notification exists (404) and belongs to the requesting user before updating `is_read = TRUE`. Attempts to alter other users' notifications are blocked with `403 Forbidden`.
     - `markAllAsRead`: Bulk updates all unread notifications to read state for the current authenticated user.
   - `notifications.controller.js`: Clean HTTP handlers mapping request parameters to service calls with standard JSON responses.
   - `notifications.routes.js`: Express router mounting endpoints protected with `authenticateToken`.
     - Static endpoints (`/api/notifications/unread-count` and `/api/notifications/read-all`) are explicitly registered *before* `/:id/read` to prevent route shadowing. Supports both `PUT` and `PATCH` for idiomatic REST consumers.

2. **Cross-Feature Broadcast Notification**:
   - Enhanced `createInternship` in `internships.service.js`: When a coordinator or administrator publishes a new internship opportunity, the system automatically queries all active students (`role = 'student' AND is_active = TRUE`) and broadcasts an automated notification alert (`type: 'new_internship_posted'`) linking directly to the new opportunity.

3. **Course Grading Access Control Reinforcement**:
   - Confirmed and verified via automated tests that only the mentor who owns the course (or an admin) can grade coursework.
   - Verified that a `coordinator` attempting to grade submissions is strictly blocked with `403 Forbidden`.
   - Verified that an `admin` can grade submissions across courses.

4. **Automated Test Suite (`backend/tests/notifications.test.js`)**:
   - 15 comprehensive automated test cases:
     - Unauthenticated requests rejected with 401 Unauthorized
     - Newly registered user starts with 0 unread notifications (200)
     - Coordinator creating an internship triggers broadcast notifications to active students
     - Student unread count increments after receiving notifications (200)
     - Paginated listing with total, page, limit, and totalPages metadata (200)
     - Filtering unread notifications using `unreadOnly=true` (200)
     - Invalid pagination parameters rejected with 400 Bad Request
     - Strict isolation: users only see their own notifications in listing
     - Strict isolation: users cannot mark another user's notification as read (403 Forbidden)
     - Marking non-existent notification returns 404 Not Found
     - Marking with invalid ID returns 400 Bad Request
     - Marking single notification as read updates database state (200)
     - Marking already read notification operates idempotently (200)
     - Marking all notifications as read updates all unread records (200)
     - Unread count drops to 0 after mark-all-as-read (200)

### Key Technical Decisions
- **Strict Row-Level Ownership**: Notification endpoints never accept arbitrary `userId` parameters from request bodies or URL paths. All queries and updates derive `userId` solely from the verified JWT payload (`req.user.id`). Attempting to manipulate a notification belonging to another user returns an explicit `403 Forbidden`.
- **Broadcast Efficiency**: When broadcasting new internship postings to all active students, notifications are constructed and inserted in a single batched multi-row SQL statement (`INSERT INTO notifications ... VALUES (...)`), avoiding N+1 round-trips to the database.
- **Route Specificity**: Express matches routes in registration sequence. Placing `/unread-count` and `/read-all` prior to `/:id/read` prevents Express from parsing literal paths as ID parameters.

### Test Results Across All Suites
```
auth.test.js          13 tests  ✔ 13 pass  ✘ 0 fail
courses.test.js       21 tests  ✔ 21 pass  ✘ 0 fail
submissions.test.js   20 tests  ✔ 20 pass  ✘ 0 fail
internships.test.js   24 tests  ✔ 24 pass  ✘ 0 fail
notifications.test.js 15 tests  ✔ 15 pass  ✘ 0 fail
───────────────────────────────────────────────────────
TOTAL                 93 tests  ✔ 93 pass  ✘ 0 fail
```

---

## Phase 7: React Frontend Core (Vite, React Router & Axios)

### Step 1: Project Setup, Auth Flow, Protected Routes & Navigation Layout

#### What Was Built
1. **Frontend Architecture (`frontend/`)**:
   - Initialized React 18 single page application bundled with Vite (`vite@5.4.11`, `@vitejs/plugin-react`).
   - Routing powered by React Router v6 (`react-router-dom@^6.28.0`).
   - HTTP communication via Axios (`axios@^1.7.9`).
   - Configured `frontend/vercel.json` with wildcard SPA routing rewrites (`/(.*)` -> `/index.html`).
   - Environment configuration template (`frontend/.env.example`) and local configuration (`frontend/.env`) consuming `VITE_API_BASE_URL`.

2. **Centralized API Client (`frontend/src/api/client.js`)**:
   - Configured Axios instance dynamically binding to `import.meta.env.VITE_API_BASE_URL` with fallback to `http://localhost:5000/api`.
   - **Request Interceptor**: Automatically attaches `Authorization: Bearer <token>` from `localStorage` on all outgoing requests.
   - **Response Interceptor**: Intercepts 401 Unauthorized responses, clears stale `localStorage` session data, and normalizes error messages into `error.friendlyMessage` for consistent UI presentation.

3. **Authentication Context (`frontend/src/context/AuthContext.jsx`)**:
   - Provides global auth state (`user`, `token`, `loading`, `isAuthenticated`, `login`, `register`, `logout`).
   - Persists JWT tokens and user profiles in `localStorage`.
   - On initial app boot, verifies token validity by pinging `GET /api/auth/me`. If invalid or expired, automatically purges credentials.

4. **Role-Based Protected Route Guard (`frontend/src/components/ProtectedRoute.jsx`)**:
   - Displays a clean loading spinner while validating authentication status.
   - Redirects unauthenticated visitors to `/login`, preserving the intended target path in location state.
   - Restricts view access by role (`allowedRoles`) and renders a clean `403 Access Denied` card if unauthorized.

5. **Shared App Layout & Navbar (`frontend/src/components/Navbar.jsx` & `Layout.jsx`)**:
   - Persistent, responsive top navigation bar with mobile hamburger drawer.
   - Role-specific link generation (Student: Courses, Internships, Applications, Grades; Mentor: Courses, Create Course; Coordinator: Internships, Post Internship).
   - Real-time unread notifications bell with dynamic red count badge (polling `/notifications/unread-count`).
   - User profile badge with role badge and logout button.

6. **Authentication Pages (`frontend/src/pages/Login.jsx` & `Register.jsx`)**:
   - `Login`: Clean credentials form with friendly error alerts and **Quick Fill Demo Account** buttons (`Student`, `Mentor`, `Coordinator`, `Admin`) for rapid local evaluation.
   - `Register`: Full account creation form with first name, last name, email, min 8-character password, and role selector (`student`, `mentor`, `coordinator`).
   - `Dashboard`: Personalized landing hero with role-tailored action cards.
   - `NotFound`: 404 page for unmatched routes.

7. **Production Styling (`frontend/src/index.css`)**:
   - Clean, modern, responsive CSS design with CSS variables, accessible color contrasts, role tags, cards, forms, and loading states.
   - Verified production build compiles cleanly (`dist/assets` generated in ~1s).

#### Key Technical Decisions
- **BOM Stripping**: Ensured all frontend source files and `package.json` are saved in UTF-8 without Byte Order Mark (BOM) to prevent Node/Vite JSON parsing errors.
- **Zero Secrets in Frontend**: API base URLs use Vite's client-exposed `VITE_` prefix convention (`VITE_API_BASE_URL`). No secrets, private keys, or passwords are baked into frontend bundles.
- **Development-Only Demo Buttons**: Quick Fill demo buttons in `Login.jsx` are conditionally gated behind `{import.meta.env.DEV && (...)}`, ensuring test credentials never appear in production client bundles.

#### Known Limitations & Production Notes
- **JWT Storage in localStorage**: The authentication token is currently persisted in browser `localStorage` for simplicity in client-side state handling. While standard for many SPAs, `localStorage` is vulnerable to token extraction if the application ever suffers an XSS (Cross-Site Scripting) vulnerability. The recommended enterprise production architecture is storing JWTs in `httpOnly`, `Secure`, `SameSite=Strict` HTTP cookies set directly by the server, preventing all client-side JavaScript access.
- **API Base URL Pathing**: In production deployment (e.g., Vercel, Railway), the `VITE_API_BASE_URL` environment variable **must include the `/api` prefix** (e.g., `https://backend-api.example.com/api`). Omitting `/api` will result in 404 responses because all Express backend routes are mounted under the `/api` namespace.

---

### Step 2: Student Screens & Full Learning/Internship Lifecycle

#### What Was Built
1. **Course Catalog & Keyword Search (`frontend/src/pages/CoursesList.jsx`)**:
   - Queries `GET /api/courses` with search filters and pagination.
   - Search bar with instant reset and keyword query binding.
   - Course cards displaying category, instructor, enrolled student counts, and description snippets.
   - Comprehensive loading skeleton, error states with manual retry, and empty state cards.

2. **Course Details & Real-Time Enrollment (`frontend/src/pages/CourseDetail.jsx`)**:
   - Comprehensive course curriculum view querying `GET /api/courses/:id`.
   - **Student Enrollment Section**: Displays real-time progress bar (0-100%) if enrolled, or a one-click "Enroll in Course" button (`POST /api/courses/:id/enroll`) that updates UI state immediately without page reload.
   - **Learning Resources Column**: Lists external links and instructional materials with clickable direct navigation.
   - **Assignments Column**: Displays assignment instructions, due date warnings, and submission trigger buttons.

3. **Assignment Submission & Grading Modal (`frontend/src/components/SubmissionModal.jsx`)**:
   - Fetches current student submission via `GET /api/assignments/:id/submissions/me`.
   - **Pre-Grading State**: Allows student to write, submit (`POST /api/assignments/:id/submissions`), or update their coursework prior to grading.
   - **Post-Grading State**: Automatically locks submission against further edits, displaying the mentor's awarded score (`X / 100`), instructor feedback quote, and submitted solution preview.

4. **Grades & Progress Center (`frontend/src/pages/MySubmissions.jsx`)**:
   - Queries `GET /api/submissions/me` displaying a complete history of coursework.
   - Displays course title, assignment name, submission timestamp, awarded score badge, and instructor feedback block.

5. **Internship Catalog & Search (`frontend/src/pages/InternshipsList.jsx`)**:
   - Queries `GET /api/internships` with search across job title, organization name, and description.
   - Status indicators: Active vs "Deadline Passed" tag, applicant count, and real-time student application badge (`Pending`, `Accepted`, `Rejected`).
   - One-click "Apply Now" button with immediate feedback.

6. **Internship Details & Status Callout (`frontend/src/pages/InternshipDetail.jsx`)**:
   - Full role description, organization information, coordinator contact, and deadline.
   - Application status banner explaining the review state and congratulations card on acceptance.

7. **My Applications Portal (`frontend/src/pages/MyApplications.jsx`)**:
   - Queries `GET /api/internships/applications/me`.
   - Lists submitted applications with company name, coordinator contact, submission date, and colored decision pills (`Pending Review`, `Accepted`, `Rejected`).

8. **Notification Center (`frontend/src/pages/Notifications.jsx`)**:
   - Queries `GET /api/notifications` with unread count badge.
   - Filter toggle between "All" and "Unread Only".
   - "Mark All as Read" bulk update (`PUT /api/notifications/read-all`).
   - Interactive notification items: clicking marks individual notification as read (`PUT /api/notifications/:id/read`) and routes directly to the relevant course or internship.

9. **Shared Pagination Bar (`frontend/src/components/Pagination.jsx`)**:
   - Reusable pagination controller showing current page, total pages, record count, and previous/next navigation buttons.

---

### Step 3: Mentor Screens (Course Creation, Curriculum Management & Submissions Grading)

#### What Was Built
1. **Course Creation (`frontend/src/pages/CourseCreate.jsx`)**:
   - Interactive course creation portal for mentors and admins at `/courses/new`.
   - Fields: Course Title, Department/Category dropdown (`Computer Science`, `Software Engineering`, `Data Science & AI`, etc.), and detailed Curriculum Description.
   - Posts to `POST /api/courses` with automatic navigation to the newly created course view upon creation.

2. **Learning Resource Attachment (`frontend/src/components/ResourceModal.jsx`)**:
   - Modal interface allowing course instructors to publish reference materials, textbook links, and slide decks (`POST /api/courses/:id/resources`).
   - Automatically detects web URLs (`http://` / `https://`) so students can click to navigate directly to external documentation or slides.

3. **Assignment Creation (`frontend/src/components/AssignmentModal.jsx`)**:
   - Modal interface for instructors to define coursework with title, detailed assignment instructions/rubrics, and optional deadlines (`POST /api/courses/:id/assignments`).
   - Formats deadlines cleanly for student view with countdown notices.

4. **Submission Review & Grading Modal (`frontend/src/components/GradeSubmissionsModal.jsx`)**:
   - Paginated review drawer querying `GET /api/assignments/:id/submissions`.
   - Displays student name, email, submission timestamp, and full submitted coursework content.
   - Inline grading form allowing instructors to assign a grade (0–100) and personalized feedback (`PUT /api/submissions/:id/grade`).
   - Triggers automated student notifications upon grade saving.

5. **Integrated Instructor Controls (`frontend/src/pages/CourseDetail.jsx`)**:
   - Real-time role check detecting whether the viewer is the owning mentor or platform administrator (`(user.role === 'mentor' && user.id === course.mentor_id) || user.role === 'admin'`).
   - Dedicated "Instructor Controls" card in the header with quick action buttons.
   - Resource and assignment deletion with safety confirmation alerts (`DELETE /api/courses/:id/resources/:id`, `DELETE /api/courses/:id/assignments/:id`).
   - Course deletion action (`DELETE /api/courses/:id`) with cascade confirmation and navigation back to `/courses`.
   - "Review & Grade Submissions" button directly on each assignment card.

6. **Catalog Action Integration (`frontend/src/pages/CoursesList.jsx`) & Routing (`frontend/src/App.jsx`)**:
   - "+ Create New Course" button displayed in the course catalog header for mentors and administrators.
   - Protected route at `/courses/new` guarded by `ProtectedRoute allowedRoles={['mentor', 'admin']}`.





