# UniLink: University Learning & Internship Platform
> **A simple ERP-style learning and internship platform**

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v5.0-blue.svg)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-v18.3-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-v5.4-purple.svg)](https://vitejs.dev/)
[![MySQL / TiDB](https://img.shields.io/badge/Database-MySQL%20%7C%20TiDB%20Cloud-orange.svg)](https://docs.pingcap.com/tidbcloud)

---

## Overview

**UniLink** is a role-based educational and internship web platform. It connects students, mentors, internship coordinators, and administrators in a single system for course delivery, assignment tracking, and internship applications.

### The Problem It Solves
Academic coursework and career opportunities are frequently handled through separate, disconnected channels:
- Coursework and assignment submissions reside in one portal.
- Internship opportunities and company postings are shared across bulletin boards and external listings.
- Mentors manage grading through disparate tools.
- Coordinators lack a direct, real-time channel to notify students of new opportunities.
- Administrators lack a centralized overview of academic activity, applications, and accounts.

**UniLink** brings these workflows together in a unified system: mentors manage curriculum and grade submissions; coordinators post opportunities and evaluate candidates; students enroll in courses, turn in assignments, track grades, and apply for internships; and administrators manage accounts, roles, and platform statistics.

---

## Live Links & Demo

> *Replace the placeholders below with your deployed URLs and media assets.*

- **Live Web Application**: `https://your-frontend-app.vercel.app` *(Placeholder)*
- **Production API Endpoint**: `https://your-backend-api.onrender.com/api` *(Render Placeholder)*
- **Project Walkthrough Video**: `https://youtube.com/watch?v=your_video_id` *(Placeholder)*

### Screenshots

> *Add your application screenshots to `docs/screenshots/` and link them below.*

- **Student Course Catalog**: `[Screenshot: Course catalog with keyword search and course cards]`
- **Course Details & Submissions**: `[Screenshot: Course curriculum, resources, and assignment submission modal]`
- **Mentor Grading**: `[Screenshot: Submissions review drawer with grade input and instructor feedback]`
- **Coordinator Internship Center**: `[Screenshot: Internship postings and applicant status review tabs]`
- **Administrator Dashboard**: `[Screenshot: User directory with role management and platform metrics]`

---

## Features by Role

### 🎓 Student
- **Course Catalog & Search**: Browse all active courses with keyword search and pagination.
- **One-Click Enrollment**: Self-enroll in courses with immediate UI feedback and duplicate-enrollment prevention.
- **Curriculum & Learning Materials**: Access course descriptions, instructor names, external reference links, and documentation.
- **Assignment Submissions**: Submit coursework; revise or update submissions prior to mentor grading.
- **Grades & Progress Tracking**: Progress bar (0–100%) calculated upon assignment completion; view awarded scores and instructor feedback.
- **Career & Internship Discovery**: Explore internships with organization names, role descriptions, and application deadlines.
- **Internship Applications**: Apply with one click; track application status (`pending`, `accepted`, `rejected`) in a dedicated applications center.
- **Interactive Notifications**: Real-time unread notification badge; broadcast notifications for new internships, status updates on applications, and assignment grades.

### 👨‍🏫 Mentor
- **Course Authoring**: Create new courses with a title and curriculum description.
- **Curriculum Management**: Attach learning resources (documentation, external links, text) and create structured assignments with instructions and deadlines.
- **Student Roster**: View all students enrolled in the mentor's courses.
- **Submission Grading**: Review student submissions with submission timestamps; award numeric grades (0–100) and written instructor feedback.
- **Content Controls**: Delete individual resources, assignments, or complete courses with cascade safeguards.

### 🏢 Internship Coordinator
- **Opportunity Publishing**: Post internship opportunities with company name, detailed role description, and application deadline.
- **Student Broadcast**: Automatically dispatches a platform-wide notification to all active students whenever a new internship is posted.
- **Applicant Review Center**: View all applicants for posted internships, filtered by decision status (`All`, `Pending`, `Accepted`, `Rejected`).
- **Hiring Decisions**: Accept or reject candidate applications with one click, automatically notifying the student in real time.
- **Opportunity Lifecycle**: Remove internship postings with confirmation safeguards.

### 🛡️ Administrator
- **Platform Analytics Dashboard**: View aggregate metrics across the institution:
  - Total registered users and role distribution (Students, Mentors, Coordinators, Admins).
  - Total active courses, student enrollments, and coursework submission/grading completion rates.
  - Active internship listings and student application acceptance ratios.
- **User Account Management**: Paginated user directory with search by name/email, role filtering, and active/inactive status filters.
- **Permission & Status Controls**: Change user roles (`student`, `mentor`, `coordinator`, `admin`) and deactivate/reactivate accounts.
- **Self-Protection Safeguards**: System strictly blocks administrators from deactivating or demoting their own accounts.
- **Cross-Platform Oversight**: Full administrative permissions to manage courses, grade submissions, and oversee internships.

---

## Tech Stack

### Backend
- **Runtime & Architecture**: [Node.js](https://nodejs.org/) (ES Modules) with [Express 5](https://expressjs.com/) for modern routing and centralized asynchronous error handling.
- **Database**: [MySQL](https://www.mysql.com/) / [TiDB Cloud](https://docs.pingcap.com/tidbcloud) (Serverless distributed SQL) with connection pooling via `mysql2/promise`.
- **Authentication**: Stateless [JSON Web Tokens (JWT)](https://jwt.io/) with Bearer token authentication in HTTP headers.
- **Password Security**: Salted hashing with [bcryptjs](https://github.com/dcodeIO/bcrypt.js) (10 salt rounds).
- **Validation**: Declarative parameter and body schema validation with [express-validator](https://express-validator.github.io/).
- **CORS Protection**: Origin restriction middleware with configurable whitelist and development fallbacks via [cors](https://github.com/expressjs/cors).
- **Testing**: Built-in Node.js test runner (`node:test`) and assertion library (`node:assert/strict`) with zero external test framework bloat.

### Frontend
- **Framework & Build Tool**: [React 18](https://react.dev/) bundled with [Vite](https://vitejs.dev/) for development and optimized production assets.
- **Routing**: [React Router v6](https://reactrouter.com/) with role-based route guards (`ProtectedRoute`) and redirect state preservation.
- **API Client**: [Axios](https://axios-http.com/) configured with request interceptors for automatic JWT injection and response interceptors for normalized error messages and session expiration handling.
- **Styling**: Vanilla modern CSS with CSS custom properties (variables), clean card layouts, badges, modals, responsive navigation, and accessible forms.
- **Deployment Ready**: Client rewrite rules configured in `frontend/vercel.json` for single-page application routing.

---

## Project Structure

```text
learning-platform/
├── backend/
│   ├── db/
│   │   ├── schema.sql              # Normalized DDL schema (users, courses, assignments, etc.)
│   │   ├── seed.sql                # Sample mock data for local testing ONLY
│   │   ├── initDb.js               # Database schema initialization script
│   │   └── seedDb.js               # Local development seed runner (refuses on SSL)
│   ├── scripts/
│   │   └── createAdmin.js          # Interactive / CI initial admin provisioning script
│   ├── src/
│   │   ├── config/
│   │   │   ├── cors.js             # CORS origin whitelist resolver & policy
│   │   │   └── db.js               # MySQL / TiDB connection pool
│   │   ├── features/
│   │   │   ├── admin/              # User management & platform stats
│   │   │   ├── auth/               # User registration, login & profile
│   │   │   ├── courses/            # Courses, resources, assignments & enrollment
│   │   │   ├── internships/        # Internship opportunities & applications
│   │   │   ├── notifications/      # Notification dispatch, count & read tracking
│   │   │   └── submissions/        # Student coursework submissions & grading
│   │   ├── middleware/
│   │   │   ├── auth.js             # JWT verification & role authorization guards
│   │   │   ├── errorHandler.js     # Centralized error handler
│   │   │   ├── notFoundHandler.js  # 404 handler
│   │   │   └── validate.js         # express-validator middleware adapter
│   │   ├── routes/
│   │   │   └── health.routes.js    # Health check endpoint
│   │   ├── app.js                  # Express app setup & route assembly
│   │   └── server.js               # Server entry point & graceful shutdown
│   ├── tests/
│   │   ├── admin.test.js           # Admin permissions & stats tests
│   │   ├── auth.test.js            # Authentication & JWT tests
│   │   ├── cors.test.js            # CORS policy & origin tests
│   │   ├── courses.test.js         # Courses & enrollment tests
│   │   ├── internships.test.js     # Internships & applications tests
│   │   ├── notifications.test.js   # Notification broadcast & isolation tests
│   │   ├── runner.js               # Multi-suite automated test orchestrator
│   │   └── submissions.test.js     # Submissions & grading tests
│   ├── .env.example                # Backend environment template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js           # Axios instance with auth interceptors
│   │   ├── components/
│   │   │   ├── AssignmentModal.jsx # Assignment authoring modal
│   │   │   ├── GradeSubmissionsModal.jsx # Instructor grading drawer
│   │   │   ├── Layout.jsx          # App shell wrapper
│   │   │   ├── Navbar.jsx          # Responsive top navigation & notification bell
│   │   │   ├── Pagination.jsx      # Reusable pagination control
│   │   │   ├── ProtectedRoute.jsx  # Role-based route guard
│   │   │   ├── ResourceModal.jsx   # Resource link attachment modal
│   │   │   └── SubmissionModal.jsx # Student coursework submission modal
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Global authentication provider
│   │   ├── pages/
│   │   │   ├── AdminStats.jsx      # Platform analytics screen
│   │   │   ├── AdminUsers.jsx      # User directory & permissions screen
│   │   │   ├── CourseCreate.jsx    # New course creation screen
│   │   │   ├── CourseDetail.jsx    # Course curriculum, resources & assignments
│   │   │   ├── CoursesList.jsx     # Course catalog with search & pagination
│   │   │   ├── Dashboard.jsx       # Personalized landing dashboard
│   │   │   ├── InternshipCreate.jsx# New internship posting screen
│   │   │   ├── InternshipDetail.jsx# Opportunity details & applicant manager
│   │   │   ├── InternshipsList.jsx # Internship listings catalog
│   │   │   ├── Login.jsx           # Sign in page (with dev-only quick fill)
│   │   │   ├── MyApplications.jsx  # Student internship applications status
│   │   │   ├── MySubmissions.jsx   # Student gradebook & submission history
│   │   │   ├── NotFound.jsx        # 404 page
│   │   │   ├── Notifications.jsx   # Notification center
│   │   │   └── Register.jsx        # Sign up page
│   │   ├── App.jsx                 # App routes and role protection map
│   │   ├── index.css               # Global responsive design system
│   │   └── main.jsx                # React DOM entry point
│   ├── index.html
│   ├── vercel.json                 # Vercel SPA rewrite configuration
│   ├── vite.config.js              # Vite configuration
│   ├── .env.example                # Frontend environment template
│   └── package.json
├── docs/
│   └── NOTES.md                    # Detailed engineering log & architecture notes
├── .gitignore                      # Git exclusion rules
└── README.md                       # Project documentation
```

---

## Local Setup Guide

Follow these steps to run the complete UniLink stack locally on your workstation.

### Prerequisites
- **Node.js**: v18.0.0 or higher (`node -v`)
- **npm**: v9.0.0 or higher (`npm -v`)
- **MySQL**: v8.0 or higher running locally, or a free [TiDB Cloud](https://tidbcloud.com/) Serverless cluster.

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/learning-platform.git
cd learning-platform
```

---

### Step 2: Install Dependencies

Install dependencies for both backend and frontend workspaces:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to repository root
cd ..
```

---

### Step 3: Configure Environment Variables

Create `.env` files in both `backend/` and `frontend/` using the provided templates.

#### Backend Configuration (`backend/.env`):
```bash
cp backend/.env.example backend/.env
```
Edit `backend/.env` with your local database credentials:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_local_mysql_password
DB_NAME=learning_platform
DB_SSL=false
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

#### Frontend Configuration (`frontend/.env`):
```bash
cp frontend/.env.example frontend/.env
```
Edit `frontend/.env` (ensure `/api` suffix is included):
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

### Step 4: Initialize the Database Schema

Run the database initialization script from the `backend/` directory. This creates the `learning_platform` database (if it doesn't already exist) and runs the normalized schema:

```bash
cd backend
npm run db:init
```

---

### Step 5: Seed Sample Data (Local Development ONLY)

> [!WARNING]
> The seed script is strictly intended for local offline development. It will automatically refuse to run if `DB_SSL=true` to protect live production databases.

```bash
cd backend
npm run db:seed
```

This creates four demo accounts (all with the default local test password: `Password123!`):
- **Admin**: `admin@platform.edu`
- **Coordinator**: `coordinator@platform.edu`
- **Mentor**: `mentor@platform.edu`
- **Student**: `student@platform.edu`

*(For live or cloud databases, use the admin provisioning script described below instead of seeding).*

---

### Step 6: Start the Backend Server

```bash
cd backend
npm run dev
```
The backend API will start on `http://localhost:5000`. You can verify health by visiting `http://localhost:5000/api/health`.

---

### Step 7: Start the Frontend Application

In a separate terminal window:
```bash
cd frontend
npm run dev
```
The React application will launch at `http://localhost:5173`. Open your browser to explore the platform.

---

### Optional: Bootstrapping an Admin on a Live Database

To create an administrator account on a live database (such as TiDB Cloud with `DB_SSL=true`) without running the development seed script:

```bash
cd backend
npm run create-admin
```
The script will prompt for the admin's email, name, and a secure password (minimum 12 characters required), or you can pass them via environment variables:

```bash
ADMIN_EMAIL="admin@university.edu" ADMIN_PASSWORD="SecureAdminPassword2026!" npm run create-admin
```

---

## Environment Variables Reference

> [!IMPORTANT]
> Never commit actual passwords, private keys, or credentials to version control. The values below are non-sensitive placeholders.

### Backend (`backend/.env`)

| Variable | Description | Required | Default / Example Placeholder |
|---|---|:---:|---|
| `PORT` | Port the Express server listens on | No | `5000` |
| `DB_HOST` | Database host (local or TiDB Cloud gateway) | Yes | `localhost` |
| `DB_PORT` | Database port | No | `3306` (or `4000` for TiDB) |
| `DB_USER` | Database username | Yes | `your_db_user` |
| `DB_PASS` | Database user password | Yes | `your_db_password` |
| `DB_NAME` | Database schema name | Yes | `learning_platform` |
| `DB_SSL` | Enable TLS/SSL connection (set `true` for TiDB Cloud) | No | `false` |
| `JWT_SECRET` | Cryptographic secret for signing JWT access tokens | Yes | `change_me_to_a_secure_random_string` |
| `JWT_EXPIRES_IN` | Token validity duration | No | `7d` |
| `FRONTEND_URL` | Allowed frontend origin(s) for CORS (comma-separated) | No | `http://localhost:5173,https://your-app.vercel.app` |

### Frontend (`frontend/.env`)

| Variable | Description | Required | Default / Example Placeholder |
|---|---|:---:|---|
| `VITE_API_BASE_URL` | Base endpoint for the backend API **(must end with `/api`)** | Yes | `http://localhost:5000/api` |

---

## API Route Reference

All responses follow a consistent JSON envelope format:
- **Success**: `{ "success": true, "data": { ... } }` or `{ "success": true, "data": [ ... ], "pagination": { ... } }`
- **Error**: `{ "success": false, "message": "Descriptive error message", "errors": [ ... ] }`

### 1. Health
| Method | Endpoint | Role Required | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | System status and database connectivity check |

### 2. Authentication
| Method | Endpoint | Role Required | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a new account (`student`, `mentor`, `coordinator`) |
| `POST` | `/api/auth/login` | Public | Authenticate credentials and receive a JWT Bearer token |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current authenticated user profile |

### 3. Courses & Curriculum
| Method | Endpoint | Role Required | Description |
|---|---|---|---|
| `GET` | `/api/courses` | Authenticated | List courses with pagination and keyword search (`?search=&page=&limit=`) |
| `POST` | `/api/courses` | Mentor, Admin | Create a new course |
| `GET` | `/api/courses/:id` | Authenticated | Get full course details, resources, assignments, and enrollment status |
| `PUT` | `/api/courses/:id` | Owning Mentor, Admin | Update course title or description |
| `DELETE` | `/api/courses/:id` | Owning Mentor, Admin | Delete a course and all associated materials (cascade) |
| `POST` | `/api/courses/:id/resources` | Owning Mentor, Admin | Add a learning resource (link or text content) |
| `DELETE` | `/api/courses/:id/resources/:resourceId` | Owning Mentor, Admin | Remove a learning resource |
| `POST` | `/api/courses/:id/assignments` | Owning Mentor, Admin | Create a new assignment with due date |
| `DELETE` | `/api/courses/:id/assignments/:assignmentId` | Owning Mentor, Admin | Remove an assignment |
| `POST` | `/api/courses/:id/enroll` | Student | Enroll logged-in student in the course |
| `GET` | `/api/courses/:id/students` | Owning Mentor, Admin | View list of enrolled students |

### 4. Coursework Submissions & Grading
| Method | Endpoint | Role Required | Description |
|---|---|---|---|
| `POST` | `/api/assignments/:id/submissions` | Enrolled Student | Submit or update coursework for an assignment |
| `GET` | `/api/assignments/:id/submissions/me` | Enrolled Student | View own submission, grade, and instructor feedback |
| `GET` | `/api/assignments/:id/submissions` | Owning Mentor, Admin | View all student submissions for an assignment (paginated) |
| `GET` | `/api/submissions/me` | Student | View full coursework and grade history across all courses |
| `GET` | `/api/submissions/:id` | Owning Student, Mentor, Admin | View a specific submission by ID |
| `PUT` | `/api/submissions/:id/grade` | Owning Mentor, Admin | Award numeric score (0–100) and feedback; notifies student |

### 5. Internships & Applications
| Method | Endpoint | Role Required | Description |
|---|---|---|---|
| `GET` | `/api/internships` | Authenticated | List internships with pagination and keyword search |
| `POST` | `/api/internships` | Coordinator, Admin | Post opportunity; broadcasts notification to all students |
| `GET` | `/api/internships/:id` | Authenticated | Retrieve detailed internship posting |
| `PUT` | `/api/internships/:id` | Owning Coordinator, Admin | Update internship posting details |
| `DELETE` | `/api/internships/:id` | Owning Coordinator, Admin | Delete internship opportunity |
| `POST` | `/api/internships/:id/apply` | Student | Apply for internship opportunity |
| `GET` | `/api/internships/:id/applications` | Owning Coordinator, Admin | List applicants for an internship with status filters |
| `GET` | `/api/internships/applications/me` | Student | View own submitted internship applications and decisions |
| `PUT` | `/api/internships/:id/applications/:appId/status` | Owning Coordinator, Admin | Set applicant status (`accepted`, `rejected`); notifies student |

### 6. Notifications
| Method | Endpoint | Role Required | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | Authenticated | View own notifications with pagination and unread filter |
| `GET` | `/api/notifications/unread-count` | Authenticated | Get unread notification badge count |
| `PUT` | `/api/notifications/:id/read` | Authenticated | Mark a specific owned notification as read |
| `PUT` | `/api/notifications/read-all` | Authenticated | Mark all owned notifications as read |

### 7. Administration
| Method | Endpoint | Role Required | Description |
|---|---|---|---|
| `GET` | `/api/admin/users` | Admin | Paginated user directory with role and status filtering |
| `PUT` | `/api/admin/users/:id/status` | Admin | Deactivate or reactivate an account (cannot deactivate self) |
| `PUT` | `/api/admin/users/:id/role` | Admin | Update user role (cannot demote own account) |
| `GET` | `/api/admin/stats` | Admin | Retrieve institution-wide statistics and metrics |

---

## Running the Automated Tests

UniLink contains a comprehensive suite of **117 automated backend integration tests** executed with Node's native test runner.

### Run All Backend Tests
```bash
cd backend
npm test
```

This runs all 7 test suites sequentially with automated database cleanup and teardown:
1. `admin.test.js` — Role guards, user updates, self-lockout prevention, and platform statistics (15 tests)
2. `auth.test.js` — Registration, authentication, token verification, and validation (13 tests)
3. `cors.test.js` — Allowed origins, preflight requests, dev localhost fallbacks, and unauthorized rejections (9 tests)
4. `courses.test.js` — Course creation, curriculum CRUD, student enrollment, and permissions (21 tests)
5. `internships.test.js` — Postings, keyword search, applications, candidate evaluation, and notifications (24 tests)
6. `notifications.test.js` — Broadcast dispatch, pagination, unread counters, and tenant isolation (15 tests)
7. `submissions.test.js` — Coursework submissions, ownership checks, grading, feedback, and notifications (20 tests)

### Validate Frontend Production Build
```bash
cd frontend
npm run build
```
Confirms clean JSX compilation, module bundling, and CSS asset generation with zero build warnings.

---

## Security Architecture & Decisions

1. **Password Hashing**: Passwords are never stored in plaintext. They are hashed using `bcryptjs` with 10 salt rounds prior to persistence.
2. **Stateless JWT Authentication**: Authenticated sessions rely on digitally signed JSON Web Tokens passed via standard `Authorization: Bearer <token>` headers.
3. **Multi-Tiered Role-Based Access Control (RBAC)**:
   - Route-level middleware (`requireRole('admin', ...)` ) validates caller permissions before invoking controller logic.
   - Resource-level ownership checks ensure mentors can only edit courses and grade assignments in courses they own; coordinators can only manage applicants for internships they posted; and students can only access their own submissions and notifications.
4. **Input Validation & Sanitization**: Incoming request parameters, query strings, and payloads are sanitized and validated against explicit schemas using `express-validator`.
5. **Origin-Restricted CORS**:
   - Production origins are strictly verified against the `FRONTEND_URL` environment variable (supporting comma-separated multi-domain setups).
   - In development mode (`NODE_ENV !== 'production'`), `http://localhost:5173` and `http://localhost:5174` are permitted for Vite development convenience.
   - Unauthorized browser origins are rejected with `403 Forbidden` and denied the `Access-Control-Allow-Origin` header.
6. **Zero Hardcoded Secrets**: All sensitive values (database passwords, JWT secret keys, port bindings) are loaded exclusively via environment variables. The codebase contains zero tracked secrets across its entire Git history.
7. **Database Seed Protection**: The local seed runner (`backend/db/seedDb.js`) contains an explicit security guard that immediately aborts execution if `DB_SSL=true`, guaranteeing test seed data will never overwrite or pollute live staging or production databases.
8. **Administrative Provisioning Guard**: The dedicated admin bootstrap script (`backend/scripts/createAdmin.js`) refuses weak passwords shorter than 12 characters and dynamically prompts for credentials.
9. **Admin Self-Lockout Safeguards**: Backend controllers prohibit administrators from deactivating their own account or modifying their own role.

---

## Known Limitations

- **Self-Service Role Selection**: The public registration endpoint currently allows users to self-select `mentor` or `coordinator` roles during account creation. In an institutional enterprise deployment, mentor and coordinator accounts should require administrative pre-approval, institutional domain email verification, or invite tokens.
- **JWT Persistence in `localStorage`**: Tokens are stored in browser `localStorage` for simplicity in client-side state management. While common in SPAs, `localStorage` can be vulnerable to token exfiltration if the application suffers from Cross-Site Scripting (XSS). An enterprise-grade architecture would migrate to server-managed `httpOnly`, `Secure`, `SameSite=Strict` HTTP cookies.
- **Email Verification & Password Reset**: There is currently no active SMTP or transactional email provider integration (e.g., SendGrid, Resend, AWS SES). Accounts are immediately active upon registration, and forgotten passwords currently require administrative intervention.
- **File Upload Storage**: Assignments, submissions, and learning resources currently accept external URLs or text content rather than direct binary file uploads.
- **Late Submission Enforcement**: Submissions submitted after an assignment's due date are permitted (and displayed with timestamp notices), rather than being strictly rejected by a hard server cutoff.

---

## What I Learned

*(Feel free to personalize and edit this section to reflect your personal growth during the project).*

- **Full-Stack Separation of Concerns**: Building a modular Node.js/Express 5 backend alongside a responsive React 18/Vite frontend deepened my appreciation for clean API contracts, standardized JSON envelopes, and decoupled architectures.
- **Robust Role-Based Authorization**: Implementing multi-tier authorization—distinguishing between global role privileges (Admin vs. Student) and entity-level resource ownership (the specific mentor who owns a course)—was key to preventing horizontal privilege escalation.
- **Enterprise Relational Modeling**: Designing normalized MySQL schemas with foreign keys, compound indexes, cascade deletion behaviors, and multi-table analytical aggregations demonstrated the power of relational databases over ad-hoc document stores.
- **Database Portability & Cloud Readiness**: Developing code compatible with both local MySQL and serverless distributed TiDB Cloud required careful attention to TLS connection configuration and integer/type parsing nuances across database drivers.
- **Defensive API Hardening**: Learning how to restrict CORS policies properly, sanitize input with `express-validator`, safeguard production databases against accidental test seeding, and audit npm dependencies against Denial of Service advisories instilled a security-first engineering mindset.
- **Automated Integration Testing**: Writing 117 automated integration tests using Node's native test runner proved that resilient software is built through comprehensive regression coverage rather than manual endpoint clicking.
