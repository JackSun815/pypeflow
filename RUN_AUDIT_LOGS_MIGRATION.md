# Audit Logs Migration Guide

## Quick Setup

You need to run the audit logs migration to create the `audit_logs` table in your Supabase database.

## Option 1: Supabase Dashboard (Recommended - Easiest)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** (in the left sidebar)
4. Click **New Query**
5. Copy and paste the entire contents of `supabase/migrations/20260108100000_create_audit_logs.sql`
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Verify success - you should see "Success. No rows returned"

## Option 2: Supabase CLI

If you have Supabase CLI set up:

```bash
# Make sure you're in the project root directory
cd /path/to/sdr-dashboard

# Link your project (if not already linked)
npx supabase link --project-ref YOUR_PROJECT_REF

# Push all pending migrations
npx supabase db push
```

## Verify Migration Success

After running the migration, verify it worked:

1. In Supabase Dashboard, go to **Table Editor**
2. You should see `audit_logs` table in the list
3. Check that it has these columns:
   - id
   - created_at
   - user_id
   - user_email
   - user_role
   - agency_id
   - action
   - entity_type
   - entity_id
   - changes
   - old_values
   - new_values
   - metadata
   - status

## Troubleshooting

If you get an error about `agencies` table not existing:
- Make sure you've run the multi-tenant migrations first
- The `audit_logs` table references `agencies(id)`, so the agencies table must exist first

