# Multi-Tenant SDR Dashboard Setup Guide

This guide explains how to set up and use the multi-tenant version of your SDR dashboard, allowing multiple agencies to use the same interface with completely isolated data.

## 🏗️ Architecture Overview

The multi-tenant system uses:
- **Subdomain-based routing**: `agency.pypeflow.com`
- **Database-level isolation**: Each agency's data is filtered by `agency_id`
- **Automatic filtering**: All database queries are automatically scoped to the current agency
- **Agency management**: Super admin interface to create and manage agencies

## 🚀 Quick Setup

### 1. Run Database Migrations

```bash
# Make the script executable and run it
chmod +x run-migrations.sh
./run-migrations.sh
```

This will:
- Create the `agencies` table
- Add `agency_id` columns to all main tables
- Create a default agency and migrate existing data

### 2. Access Agency Management

1. Login as super admin: `eric@parakeet.io` / `asdfasdf`
2. Click "Manage Agencies" in the manager dashboard
3. Create your first agency

### 3. Test Multi-Tenancy

- Create an agency with subdomain `test-agency`
- Access it via: `http://localhost:3000?agency=test-agency`
- Verify data isolation between agencies

## 🌐 Domain Setup

### Development
- Use URL parameters: `?agency=agency-name`
- Or simulate subdomains with different ports

### Production
Set up wildcard DNS for `*.pypeflow.com`:
```
*.pypeflow.com    A    YOUR_SERVER_IP
```

## 📊 Database Schema

### New Tables
- `agencies`: Stores agency information and settings

### Modified Tables
All main tables now have `agency_id` column:
- `profiles`
- `clients` 
- `meetings`
- `assignments`
- `commission_goal_overrides`
- `compensation_structures`

## 🔧 How It Works

### 1. Agency Detection
The system automatically detects the agency from:
- Subdomain (e.g., `agency.pypeflow.com`)
- URL parameter (e.g., `?agency=agency-name`)
- Falls back to default agency

### 2. Automatic Data Filtering
All database queries are automatically filtered by `agency_id`:

```typescript
// This query automatically becomes:
const { data } = await supabase.from('clients').select('*');
// SELECT * FROM clients WHERE agency_id = 'current-agency-id'
```

### 3. Agency Context
The `AgencyContext` provides agency information throughout the app:

```typescript
const { agency, loading, error } = useAgency();
```

## 🎯 Creating Agencies

### Via Agency Management Interface
1. Login as super admin
2. Go to "Manage Agencies"
3. Click "Create New Agency"
4. Fill in:
   - **Agency Name**: Display name (e.g., "Acme Sales Agency")
   - **Subdomain**: URL identifier (e.g., "acme-sales")

### Via Database (Advanced)
```sql
INSERT INTO agencies (name, subdomain, is_active) 
VALUES ('Agency Name', 'agency-subdomain', true);
```

## 🔒 Security Features

### Data Isolation
- Complete data separation between agencies
- Automatic filtering prevents cross-agency data access
- Agency-specific authentication tokens

### Access Control
- Super admin can manage all agencies
- Regular users only see their agency's data
- Agency-specific user management

## 🚀 Deployment

### Vercel/Netlify
1. Set up wildcard domain: `*.pypeflow.com`
2. Deploy your app
3. Each agency gets: `agency.pypeflow.com`

### Custom Server
1. Configure reverse proxy for subdomain routing
2. Point all subdomains to your app
3. The app handles agency detection automatically

## 🧪 Testing

### Create Test Agencies
```bash
# Via SQL (for testing)
INSERT INTO agencies (name, subdomain, is_active) VALUES 
('Test Agency 1', 'test1', true),
('Test Agency 2', 'test2', true);
```

### Test Data Isolation
1. Create users/clients in different agencies
2. Verify they can't see each other's data
3. Test all CRUD operations

## 📝 API Usage

### Agency-Aware Queries
All existing hooks automatically use agency filtering:

```typescript
// These hooks now automatically filter by agency
const { clients } = useAllClients();
const { meetings } = useMeetings();
const { sdrs } = useSDRs();
```

### Manual Agency Client
```typescript
import { createAgencyClient } from './lib/supabase';

const agencyClient = createAgencyClient('agency-id');
const { data } = await agencyClient.from('clients').select('*');
```

## 🐛 Troubleshooting

### Agency Not Found
- Check subdomain exists in `agencies` table
- Verify agency is active (`is_active = true`)
- Check URL format

### Data Not Loading
- Verify `agency_id` is set on records
- Check agency context is loaded
- Review browser console for errors

### Cross-Agency Data Leak
- Ensure all queries use agency-aware client
- Check database constraints
- Verify RLS policies

## 🔄 Migration from Single-Tenant

The migration script automatically:
1. Creates default agency
2. Assigns all existing data to default agency
3. Preserves all existing functionality

Your existing data and users will continue working exactly as before, but now under the default agency.

## 📞 Support

For issues with multi-tenancy:
1. Check the browser console for errors
2. Verify agency context is loaded
3. Check database migrations completed successfully
4. Ensure subdomain routing is configured correctly

## 🎉 Benefits

- **Scalable**: Add unlimited agencies
- **Isolated**: Complete data separation
- **Secure**: Automatic filtering prevents data leaks
- **Flexible**: Agency-specific settings and customizations
- **Cost-effective**: Single codebase, multiple tenants
