#!/bin/bash

echo "🚀 Setting up Strapi Blog Backend for PypeFlow"
echo "=============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Create Strapi project
echo "📦 Creating Strapi project..."
npx create-strapi-app@latest pypeflow-blog-backend --quickstart

if [ $? -eq 0 ]; then
    echo "✅ Strapi project created successfully!"
    echo ""
    echo "🎉 Next Steps:"
    echo "1. cd pypeflow-blog-backend"
    echo "2. npm run develop"
    echo "3. Go to http://localhost:1337/admin"
    echo "4. Create admin account"
    echo "5. Follow the BLOG_SETUP.md guide to configure content types"
    echo ""
    echo "📚 For detailed instructions, see BLOG_SETUP.md"
else
    echo "❌ Failed to create Strapi project"
    exit 1
fi
