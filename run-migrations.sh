#!/bin/bash

# Script to run multi-tenant database migrations
echo "🚀 Running multi-tenant database migrations..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "📋 Running migrations in order..."

# Run migrations
echo "1️⃣ Creating agencies table..."
supabase db push

echo "2️⃣ Adding agency_id columns..."
supabase db push

echo "3️⃣ Creating default agency and migrating data..."
supabase db push

echo "✅ All migrations completed successfully!"
echo ""
echo "🎉 Your SDR dashboard is now multi-tenant ready!"
echo ""
echo "Next steps:"
echo "1. Create your first agency using the Agency Management interface"
echo "2. Set up subdomain routing (agency.pypeflow.com)"
echo "3. Test the multi-tenant functionality"
echo ""
echo "To access agency management:"
echo "- Login as super admin (eric@parakeet.io)"
echo "- Click 'Manage Agencies' in the manager dashboard"
