# SDR Dashboard

A multi-tenant SaaS platform for managing Sales Development Representative (SDR) teams. Built for sales agencies running outbound meeting-booking operations across multiple clients.

## What It Does

The platform serves three distinct user types, each with their own dashboard:

**Manager Dashboard** — Full visibility into team performance. Managers track meetings set and held per SDR, monitor goal attainment, manage client assignments, configure compensation structures, run ICP (Ideal Customer Profile) qualification reviews, and export reports. Includes a complete audit log of every action taken in the system.

**SDR Dashboard** — Individual performance view for each sales rep. SDRs log meetings, track their own metrics against monthly targets, view their commission earnings, import meetings in bulk via CSV, and share a public version of their dashboard via a shareable token link — no login required for the recipient.

**Client Dashboard** — Read-only view for end clients to monitor the meetings being booked on their behalf. Accessible via a secure token link, no account needed.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, TailwindCSS
- **Backend/Database:** Supabase (PostgreSQL + Realtime + Row Level Security)
- **Deployment:** Vercel

## Multi-Tenancy

Each agency gets its own subdomain (e.g., `agency.yourdomain.com`). All data is isolated at the database level via RLS policies — one agency can never read another's data.

## Getting Started

**Prerequisites:** Node.js 18+, a Supabase project

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your Supabase project settings

# 3. Run the dev server
npm run dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

## Database

Migrations live in `supabase/migrations/`. Apply them via the Supabase CLI:

```bash
supabase db push
```

Key tables: `profiles`, `clients`, `meetings`, `assignments`, `agencies`, `compensation_structures`, `audit_logs`

## Authentication

- **Managers** log in via email/password stored in the `manager_credentials` table (bcrypt-hashed)
- **SDRs and clients** access their dashboards via secure token links — no login required
- **Super admins** have access to the agency management panel at `/admin/agencies`

To create the first manager account, insert a row into `manager_credentials` with a bcrypt-hashed password.
