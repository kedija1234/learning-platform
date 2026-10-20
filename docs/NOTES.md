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
