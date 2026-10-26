# UniLink: Zero-Cost Production Deployment Guide

This guide provides end-to-end instructions for deploying the **UniLink: University Learning & Internship Platform** to free-tier cloud infrastructure:
- **Database**: [TiDB Cloud](https://tidbcloud.com/) (Serverless / Starter Free Tier MySQL-compatible distributed SQL)
- **Backend API**: [Render](https://render.com/) (Free Tier Web Service)
- **Frontend SPA**: [Vercel](https://vercel.com/) (Free Hobby Tier Static / SPA Hosting)

---

## Deployment Architecture & Sequence

Deploying a decoupled full-stack application requires a specific sequence so that URLs and CORS policies connect correctly:

```text
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   TiDB Cloud    │ ◄───  │  Render Backend │ ◄───  │  Vercel Frontend│
│ (Database Layer)│       │  (Express 5 API)│       │ (React 18 / SPA)│
└─────────────────┘       └─────────────────┘       └─────────────────┘
      Step 1                    Step 2                    Step 3
                                   ▲
                                   │ Step 4: Update FRONTEND_URL (CORS)
                                   └───────────────────────────────────
                                   
      Step 5: Provision Live Admin via local terminal (npm run create-admin)
```

1. **Step 1**: Provision TiDB Cloud database, generate credentials, and execute the schema.
2. **Step 2**: Deploy the Express backend to Render, connect to TiDB Cloud, and obtain the Render service URL.
3. **Step 3**: Deploy the React frontend to Vercel, pointing `VITE_API_BASE_URL` to the Render service URL.
4. **Step 4**: Update Render's `FRONTEND_URL` environment variable with your production Vercel domain to finalize CORS security.
5. **Step 5**: Provision the initial administrator account on the live database using `npm run create-admin` from your local terminal.

---

## Step 1: Database Setup on TiDB Cloud (Starter Instance)

TiDB Cloud provides a fully managed, serverless, MySQL 8.0-compatible database with a generous free tier and built-in TLS encryption.

### 1.1 Create Cluster
1. Navigate to [tidbcloud.com](https://tidbcloud.com/) and register or sign in.
2. Click **Create Cluster** and select the **Starter / Serverless** (Free) tier.
3. Choose a cloud provider (AWS or Google Cloud) and select a region closest to your expected users (e.g., `us-east-1` or `eu-central-1`).
4. Click **Create**. The cluster will provision in approximately 30–60 seconds.

### 1.2 Obtain Connection Details & Password
1. Once the cluster status shows **Running**, click **Connect** in the cluster overview.
2. In the **Connect** modal:
   - Select connection method: **General** or **MySQL Client**.
   - Note your connection parameters:
     - **Host**: (e.g., `gateway01.us-east-1.prod.aws.tidbcloud.com`)
     - **Port**: `4000`
     - **User**: (e.g., `xxxxxxxx.root`)
3. Click **Generate Password**. 
   - A modal will display your new generated database password.
   - **Important**: Copy this password immediately and store it in a secure temporary note. TiDB Cloud will never show this plaintext password again.

### 1.3 Initialize Database & Execute Schema
1. In the TiDB Cloud Console navigation, click **SQL Editor**.
2. First, create and select the application database:
   ```sql
   CREATE DATABASE IF NOT EXISTS learning_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   USE learning_platform;
   ```
3. Open `backend/db/schema.sql` from this repository, copy its entire contents, paste it into the TiDB Cloud SQL Editor, and click **Run**.
4. The schema statements will execute in the following required dependency order:
   1. `users` — Base accounts and roles (`student`, `mentor`, `coordinator`, `admin`)
   2. `courses` — Mentors' course curricula (foreign key to `users`)
   3. `enrollments` — Student course enrollments & progress tracking (foreign keys to `users` and `courses`)
   4. `resources` — Course reference links and materials (foreign key to `courses`)
   5. `assignments` — Coursework prompts and deadlines (foreign key to `courses`)
   6. `submissions` — Student coursework and mentor grading (foreign keys to `assignments` and `users`)
   7. `internships` — Coordinator postings and deadlines (foreign key to `users`)
   8. `applications` — Student internship applications (foreign keys to `internships` and `users`)
   9. `notifications` — Role-based alerts and unread tracking (foreign key to `users`)

> [!NOTE]
> **Harmless TiDB Warnings**: When executing `schema.sql`, TiDB Cloud may display informational notices or warnings regarding `CHECK` constraints, `FULLTEXT` syntax, or `ENGINE=InnoDB`. TiDB automatically handles table storage internally; these notices are completely harmless compatibility warnings and do not affect table creation or constraints.

---

## Step 2: Backend API Deployment on Render

Render's free tier provides Web Service hosting suitable for Node.js REST APIs.

### 2.1 Create Web Service
1. Log in to [render.com](https://render.com/).
2. On the Dashboard, click **New +** and choose **Web Service**.
3. Connect your GitHub repository: `learning-platform`.
4. Configure the service settings:
   - **Name**: `unilink-backend` *(or a name of your choice)*
   - **Region**: Choose the region closest to your TiDB Cloud cluster (e.g., `Oregon (US West)` or `Frankfurt (EU)`)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

### 2.2 Configure Environment Variables
Under the **Environment Variables** section on Render, add the following key-value pairs (use your actual TiDB Cloud values; placeholders shown below):

| Key | Value / Placeholder | Description |
|---|---|---|
| `NODE_ENV` | `production` | Enforces production mode and security guards |
| `DB_HOST` | `gateway01.us-east-1.prod.aws.tidbcloud.com` | TiDB host from Connect modal |
| `DB_PORT` | `4000` | TiDB port (typically 4000) |
| `DB_USER` | `your_user.root` | TiDB username |
| `DB_PASS` | `your_generated_tidb_password` | TiDB generated password |
| `DB_NAME` | `learning_platform` | Application database name |
| `DB_SSL` | `true` | **Required**: Enforces TLS/SSL connection to TiDB Cloud |
| `JWT_SECRET` | `change_me_to_a_random_32_character_string` | Cryptographic secret for signing JWT tokens |
| `JWT_EXPIRES_IN` | `7d` | Token validity duration |
| `FRONTEND_URL` | `http://localhost:5173` | Temporary value; will be updated in Step 4 |

> [!NOTE]
> Render automatically injects the `PORT` environment variable (typically `10000`). The Express server binds to `process.env.PORT` automatically.

### 2.3 Deploy & Verify Backend Health
1. Click **Create Web Service**.
2. Wait for the build and deployment to complete (Render build logs will show `npm install` and `Server running on port 10000`).
3. Note your backend URL at the top of the Render service page:
   `https://unilink-backend.onrender.com`
4. Test health connectivity in your browser or with curl:
   ```bash
   curl https://unilink-backend.onrender.com/api/health
   ```
   Expected response:
   ```json
   {
     "success": true,
     "message": "UniLink API is healthy",
     "database": "connected",
     "timestamp": "2026-10-26T..."
   }
   ```

---

## Step 3: Frontend SPA Deployment on Vercel

Vercel provides optimized global edge hosting for Vite/React single-page applications.

### 3.1 Import Project
1. Log in to [vercel.com](https://vercel.com/).
2. On your dashboard, click **Add New...** -> **Project**.
3. Import the `learning-platform` repository.

### 3.2 Configure Build & Output Settings
1. In the **Configure Project** screen:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and select `frontend`
   - Leave Build and Output Settings as default:
     - Build Command: `npm run build` (or `vite build`)
     - Output Directory: `dist`
     - Install Command: `npm install`

### 3.3 Set Frontend Environment Variable
In the **Environment Variables** section on Vercel, add:

| Key | Value | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `https://unilink-backend.onrender.com/api` | Base API URL pointing to your Render backend |

> [!IMPORTANT]
> - `VITE_API_BASE_URL` **must end with `/api`** because all Express routes are mounted under the `/api` prefix.
> - **Do NOT add a trailing slash** at the end (e.g., use `.../api`, not `.../api/`).

### 3.4 Deploy
1. Click **Deploy**.
2. Vercel will install dependencies, compile the React build, and deploy your site in ~30 seconds.
3. Note your deployed Vercel domain:
   `https://unilink-frontend.vercel.app`

> [!NOTE]
> **Single Page Application Routing**: Client-side routing on refresh (e.g., navigating directly to `/courses` or `/dashboard`) is automatically handled by the included [`frontend/vercel.json`](file:///c:/Users/asus/OneDrive/Desktop/learning-platform/frontend/vercel.json) rewrite rule:
> ```json
> {
>   "rewrites": [
>     { "source": "/(.*)", "destination": "/index.html" }
>   ]
> }
> ```

---

## Step 4: Finalize CORS Configuration on Render

Now that your production frontend domain exists, update the backend's allowed origins to secure your API and prevent CORS blocks.

1. Go to your [Render Dashboard](https://dashboard.render.com/) and select your `unilink-backend` service.
2. Click **Environment** in the left sidebar.
3. Find the `FRONTEND_URL` variable and update its value to your Vercel domain:
   ```text
   FRONTEND_URL=https://unilink-frontend.vercel.app
   ```
   *(If you also wish to allow local testing or a custom domain, provide a comma-separated list without spaces, e.g.: `https://unilink-frontend.vercel.app,http://localhost:5173`)*
4. **Ensure there is NO trailing slash** (use `https://your-app.vercel.app`, not `https://your-app.vercel.app/`).
5. Click **Save Changes**. Render will automatically trigger a zero-downtime redeploy.

---

## Step 5: Provision the First Admin on the Live Database

> [!WARNING]
> **Never run `npm run db:seed` on the live database.** The seed script is strictly for local offline mock testing and will automatically abort if `DB_SSL=true`.

To safely bootstrap your initial administrator account on TiDB Cloud without committing credentials or hardcoding passwords, execute the dedicated provisioning script from your local workstation terminal.

### 5.1 Run Provisioning Script Locally
Open a terminal on your computer and run `create-admin` with temporary inline environment variables matching your TiDB Cloud credentials:

```bash
cd backend

DB_HOST="gateway01.us-east-1.prod.aws.tidbcloud.com" \
DB_PORT="4000" \
DB_USER="your_user.root" \
DB_PASS="your_tidb_password" \
DB_NAME="learning_platform" \
DB_SSL="true" \
ADMIN_EMAIL="admin@university.edu" \
ADMIN_PASSWORD="YourSecureAdminPassword2026!" \
npm run create-admin
```

### 5.2 Or Use the Interactive Terminal Prompt
If you prefer not to pass credentials inline, simply specify the database connection variables and let the script prompt you securely in the terminal:

```bash
cd backend

DB_HOST="gateway01.us-east-1.prod.aws.tidbcloud.com" \
DB_PORT="4000" \
DB_USER="your_user.root" \
DB_PASS="your_tidb_password" \
DB_NAME="learning_platform" \
DB_SSL="true" \
npm run create-admin
```
The script will prompt:
1. `Admin Email`: Enter the admin email address
2. `First Name`: (Default: `System`)
3. `Last Name`: (Default: `Admin`)
4. `Password`: Enter a password (**minimum 12 characters required**)

The script will hash the password with bcrypt, insert the administrator record into TiDB Cloud, and print:
`[SUCCESS] Admin account created successfully!`

You can now log in at `https://unilink-frontend.vercel.app/login` with your administrator credentials.

---

## Step 6: Troubleshooting & Common Issues

### 1. "Network Error" or "Failed to Fetch" in Browser
- **Cause**: The Render free instance has spun down due to inactivity, or the API URL is incorrect.
- **Fix**:
  1. Open `https://your-backend.onrender.com/api/health` directly in your browser.
  2. If the page takes 30–60 seconds to respond, Render was sleeping (see issue #6 below).
  3. Verify that `VITE_API_BASE_URL` in Vercel ends with `/api` and has no trailing slash.

### 2. CORS Policy Violation (`CORS policy violation: Origin ... is not allowed`)
- **Cause**: The browser is blocking requests because Render's `FRONTEND_URL` environment variable does not match the Vercel domain.
- **Fix**:
  1. Check the browser console for the exact rejected origin (e.g., `https://unilink-frontend.vercel.app`).
  2. Go to Render -> **Environment** -> check `FRONTEND_URL`.
  3. Ensure the protocol matches (`https://`) and that there is **no trailing slash**.
  4. If using a custom domain or preview branch, add it as a comma-separated value:
     `FRONTEND_URL=https://unilink-frontend.vercel.app,https://yourcustomdomain.com`

### 3. `getaddrinfo ENOTFOUND` in Render Logs
- **Cause**: The backend cannot resolve the database hostname (`DB_HOST`).
- **Fix**:
  1. Re-open the TiDB Cloud **Connect** modal.
  2. Verify that `DB_HOST` in Render does not include `mysql://`, `@`, or a port number (e.g., use `gateway01.us-east-1.prod.aws.tidbcloud.com`, not `gateway01...:4000`).

### 4. `Access denied for user` in Render Logs
- **Cause**: Incorrect database username, password, or SSL setting.
- **Fix**:
  1. Verify `DB_SSL=true` is set in Render's environment variables. TiDB Cloud strictly requires TLS connections.
  2. Ensure `DB_USER` includes the cluster prefix (e.g., `xxxxxxxx.root`).
  3. If you misplaced the password generated during cluster creation, click **Reset Password** in the TiDB Cloud console and update `DB_PASS` on Render.

### 5. `404 Not Found` on Page Refresh (Vercel)
- **Cause**: Refreshing the browser on a client-side route like `/courses` causes the web server to search for a physical file named `/courses/index.html`.
- **Fix**:
  1. Verify that [`frontend/vercel.json`](file:///c:/Users/asus/OneDrive/Desktop/learning-platform/frontend/vercel.json) is committed and present at the frontend root with the rewrite configuration pointing all paths to `/index.html`.

### 6. Free Backend Instance Sleeping (Spin-down on Inactivity)
- **Cause**: Render's free tier automatically spins down web services after 15 minutes of inactivity to preserve resources.
- **Impact**: The first HTTP request after a period of inactivity experiences a "cold start" delay of 30 to 60 seconds while the container initializes.
- **Recommendations**:
  - Inform evaluators that the initial page load may take ~45 seconds while the free container wakes up.
  - To prevent sleep during presentations or active evaluation, set up a free monitor (e.g., [UptimeRobot](https://uptimerobot.com/) or [cron-job.org](https://cron-job.org/)) to send an HTTP GET request to `https://your-backend.onrender.com/api/health` every 10 minutes.
