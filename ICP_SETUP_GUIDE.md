# ICP Check Feature Setup Guide

## Current Status
The ICP Check feature is implemented but requires database migration to work fully.

## What's Working Now
- ✅ Meeting addition works (no errors)
- ✅ ICP Check page loads and shows meetings
- ✅ Approve/Deny actions work (using notes-only mode)
- ✅ SDR dashboard shows ICP status badges
- ✅ All components handle missing database fields gracefully

## What Needs Database Migration
- ⏳ Full ICP status tracking (`icp_status`, `icp_checked_at`, `icp_checked_by`, `icp_notes`)
- ⏳ Proper filtering of pending vs approved/denied meetings
- ⏳ "Not ICP Qualified" section in SDR dashboard

## How to Apply Database Migration

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `setup_icp_fields.sql`
4. Click **Run** to execute the script
5. Verify the migration worked by checking the table structure

### Option 2: Supabase CLI (If you have access)
```bash
# Login to Supabase
npx supabase login

# Link your project (if not already linked)
npx supabase link --project-ref YOUR_PROJECT_REF

# Apply the migration
npx supabase db push
```

## What the Migration Does
1. **Adds ICP columns** to the meetings table:
   - `icp_status`: 'pending', 'approved', or 'denied'
   - `icp_checked_at`: Timestamp when reviewed
   - `icp_checked_by`: Manager who reviewed
   - `icp_notes`: Optional notes from manager

2. **Creates indexes** for efficient queries

3. **Sets default values** for existing meetings

## After Migration
Once the migration is applied:

1. **New meetings** will automatically get `icp_status: 'pending'`
2. **ICP Check page** will only show pending meetings
3. **Approve/Deny actions** will properly update ICP status
4. **SDR dashboard** will show the "Not ICP Qualified" section
5. **Full audit trail** will be maintained

## Current Workaround
Until the migration is applied, the system works in "notes-only mode":
- Approve/Deny actions add notes to meetings
- All meetings are shown in ICP Check (not filtered)
- SDR dashboard works normally without ICP filtering

## Testing the Feature
1. **Before migration**: Test that meetings can be added and ICP Check page loads
2. **After migration**: Test the full ICP workflow
   - Add a meeting → should appear in ICP Check
   - Approve/Deny in ICP Check → should update status
   - Check SDR dashboard → should show ICP status and denied meetings

## Troubleshooting
If you encounter issues:
1. Check that the SQL script ran successfully
2. Verify the new columns exist in the meetings table
3. Clear browser cache and refresh the page
4. Check browser console for any remaining errors
