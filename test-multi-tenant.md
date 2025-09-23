# Multi-Tenant System Test Guide

## ✅ Database Migrations Completed
The three migrations have been successfully applied to your Supabase database.

## 🧪 Testing the Multi-Tenant System

### 1. Test Default Agency (Existing Functionality)
- Visit: `http://localhost:5173`
- Login as manager: `eric@parakeet.io` / `asdfasdf`
- Verify all existing data is still accessible
- This should work exactly as before (all data is now under the "Default Agency")

### 2. Test Agency Management Interface
- In the manager dashboard, look for the "Manage Agencies" button (purple button with shield icon)
- Click it to access the agency management interface
- You should see the "Default Agency" listed

### 3. Create a Test Agency
- Click "Create New Agency"
- Fill in:
  - **Agency Name**: "Test Agency"
  - **Subdomain**: "test-agency"
- Click "Create Agency"
- You should see the new agency in the list

### 4. Test Agency-Specific Access
- Copy the URL for your test agency (should be something like `http://localhost:5173?agency=test-agency`)
- Open it in a new browser tab/window
- You should see the agency loading screen, then the landing page
- The test agency will have no data initially (completely isolated from default agency)

### 5. Test Data Isolation
- In the default agency, create some test data (clients, SDRs, meetings)
- Switch to the test agency URL
- Verify that the test agency cannot see the default agency's data
- This proves complete data isolation

## 🔍 What to Look For

### ✅ Success Indicators
- No JavaScript errors in browser console
- Agency context loads properly
- Data is filtered by agency
- Agency management interface works
- Complete data isolation between agencies

### ❌ Potential Issues
- **Agency not found errors**: Check if agency exists in database
- **Data not loading**: Verify agency_id is set on records
- **Cross-agency data leaks**: Check that filtering is working

## 🛠️ Troubleshooting

### If you see "Agency not found" errors:
1. Check your Supabase database for the agencies table
2. Verify the default agency exists:
   ```sql
   SELECT * FROM agencies WHERE id = '00000000-0000-0000-0000-000000000000';
   ```

### If data isn't loading:
1. Check that existing records have agency_id set:
   ```sql
   SELECT COUNT(*) FROM profiles WHERE agency_id IS NULL;
   SELECT COUNT(*) FROM clients WHERE agency_id IS NULL;
   ```

### If you see cross-agency data:
1. Check that the agency filtering is working
2. Verify all hooks are using the agency-aware client

## 🎉 Expected Results

After successful testing, you should have:
- ✅ Working multi-tenant system
- ✅ Complete data isolation
- ✅ Agency management interface
- ✅ Subdomain-based routing support
- ✅ Backward compatibility with existing data

## 🚀 Next Steps

Once testing is complete:
1. Set up production subdomain routing (`*.pypeflow.com`)
2. Create production agencies
3. Migrate existing clients to their own agencies
4. Configure custom domains if needed

## 📞 Support

If you encounter any issues:
1. Check browser console for errors
2. Verify database migrations completed successfully
3. Check that agency context is loading properly
4. Ensure all existing data has agency_id set
