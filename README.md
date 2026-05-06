# Ascend Coach Portal

Coach recruitment tracking portal for Ascend Speech & Debate. Coaches log outreach activity, track referral conversions, and owners get a weekly email digest.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Tailwind CSS (Vite) |
| Backend | Vercel Serverless Functions (`/api`) |
| Database | Postgres via Supabase |
| Auth | JWT (stored in localStorage) |
| Email | Resend |
| Hosting | Vercel |

---

## Local Development

### Prerequisites

- Node.js 18+
- [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`
- A Supabase project with the relevant tables (see Migrations below)
- A [Resend](https://resend.com) account

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill in env vars
cp .env.example .env.local
# Edit .env.local with your real values

# 3. Run migrations against your Supabase database
# (see Migrations section below)

# 4. Start the dev server (Vercel dev serves both frontend + API on port 3000)
npm run dev
```

Open http://localhost:3000

> **Note:** `npm run dev` runs `vercel dev`, which requires you to have linked the project (`vercel link`) or will prompt you to do so on first run. Alternatively, run `vite dev` (port 3001) for frontend-only work — API calls will proxy to port 3000 via the Vite proxy config.

---

## Environment Variables

Set these in Vercel's project settings (Production/Preview/Development) and locally in `.env.local`:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase Postgres connection string. Use the **pooler URL** (port 6543) for serverless. |
| `JWT_SECRET` | Random secret for signing JWTs. Generate: `openssl rand -hex 32` |
| `RESEND_API_KEY` | API key from [resend.com](https://resend.com/api-keys) |
| `OWNER_EMAILS` | Comma-separated emails for the weekly digest, e.g. `a@ascendspeech.org,b@ascendspeech.org` |

---

## Migrations

The app expects two existing tables (`referrers`, `hub_referrals`) and creates two new ones.

### Run the migration

Connect to your Supabase database and run:

```bash
# Option A: Supabase SQL editor
# Paste the contents of migrations/001_create_coach_tables.sql

# Option B: psql
psql "$DATABASE_URL" -f migrations/001_create_coach_tables.sql
```

### What it creates

**`coach_outreach_log`** — Each contact attempt a coach makes:
- `id`, `coach_id` (→ referrers), `contact_name`, `contact_method`, `status`, `notes`, `created_at`

**`coach_accounts`** — Auth layer on top of referrers:
- `id`, `referrer_id` (→ referrers), `email`, `password_hash`, `role`, `invite_token`, `invite_token_expires_at`, `created_at`

---

## Creating the First Owner Account

After running migrations, manually insert an owner account in Supabase:

```sql
-- 1. Find the referrer_id for the owner
SELECT id FROM referrers WHERE email = 'aditya@ascendspeech.org';

-- 2. Insert owner account (they'll set their password via invite flow)
INSERT INTO coach_accounts (referrer_id, email, role, invite_token, invite_token_expires_at)
VALUES (
  '<referrer_id_from_above>',
  'aditya@ascendspeech.org',
  'owner',
  'initial-setup-token',
  NOW() + INTERVAL '7 days'
);
```

Then visit `/setup-password?token=initial-setup-token` to set the password.

---

## Deploy to Vercel

```bash
# 1. Push to GitHub
git push origin main

# 2. Import the repo in Vercel dashboard
#    vercel.com/new → import from GitHub

# 3. Set all environment variables in Vercel project settings

# 4. Deploy — Vercel auto-detects Vite and builds correctly
```

The `vercel.json` configures:
- **SPA rewrites** — all non-API routes serve `index.html` for React Router
- **Weekly cron** — `/api/cron/weekly-digest` runs every Monday at 8am PT (15:00 UTC)

---

## API Reference

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | — | Email + password → JWT |
| POST | `/api/auth/setup-password` | — | Invite token + password → sets password, returns JWT |
| POST | `/api/auth/invite` | Owner | Send invite email to a referrer |

### Coach

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/coach/me` | Coach/Owner | Current coach profile + referral code |
| GET | `/api/coach/referrals` | Coach/Owner | Referral count + list |
| GET | `/api/coach/outreach` | Coach/Owner | Outreach log entries |
| POST | `/api/coach/outreach` | Coach/Owner | Log a new outreach entry |
| PATCH | `/api/coach/outreach/:id` | Coach/Owner | Update status or notes |

### Admin

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/coaches` | Owner | All coaches with stats + outreach logs |

### Cron

| Method | Path | Description |
|---|---|---|
| GET | `/api/cron/weekly-digest` | Sends Monday digest email (Vercel-triggered) |

---

## Project Structure

```
/
├── api/                        # Vercel Serverless Functions
│   ├── _lib/
│   │   ├── db.js               # Postgres pool singleton
│   │   ├── auth.js             # JWT sign/verify helpers
│   │   └── cors.js             # CORS header utility
│   ├── auth/
│   │   ├── login.js
│   │   ├── setup-password.js
│   │   └── invite.js
│   ├── coach/
│   │   ├── me.js
│   │   ├── referrals.js
│   │   └── outreach/
│   │       ├── index.js        # GET + POST /api/coach/outreach
│   │       └── [id].js         # PATCH /api/coach/outreach/:id
│   ├── admin/
│   │   └── coaches.js
│   └── cron/
│       └── weekly-digest.js
├── src/                        # React frontend (Vite)
│   ├── components/
│   │   ├── Layout.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── StatusBadge.jsx
│   ├── lib/
│   │   ├── api.js              # Fetch wrapper with auth header
│   │   └── AuthContext.jsx     # Auth state + hooks
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── SetupPassword.jsx
│   │   ├── Dashboard.jsx
│   │   └── Admin.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── migrations/
│   └── 001_create_coach_tables.sql
├── vercel.json
├── .env.example
├── package.json
├── vite.config.js
└── tailwind.config.js
```
