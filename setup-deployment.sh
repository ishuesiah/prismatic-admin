#!/bin/bash

# Deployment Setup Script for Intelligent Customer Service Platform
# This script prepares the application for deployment

set -e  # Exit on error

echo "========================================"
echo "🚀 Deployment Setup Script"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Found project root"

# Step 2: Check for .env file
if [ ! -f "apps/admin-ui/.env" ]; then
    echo -e "${YELLOW}⚠ Warning: No .env file found in apps/admin-ui/${NC}"
    echo ""
    echo "Please create apps/admin-ui/.env with the following variables:"
    echo ""
    cat << 'ENVEXAMPLE'
DATABASE_URL="postgresql://user:password@localhost:5432/prismatic"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"

# AI Integration
ANTHROPIC_API_KEY="sk-ant-..."

# Shopify (optional)
SHOPIFY_STORE_URL="your-store.myshopify.com"
SHOPIFY_ACCESS_TOKEN="shpat_..."

# ShipStation (optional)
SHIPSTATION_API_KEY="..."
SHIPSTATION_API_SECRET="..."
SHIPSTATION_BASE_URL="https://ssapi.shipstation.com"

# Debug Mode (optional)
NEXT_PUBLIC_DEBUG_MODE="true"
ENVEXAMPLE
    echo ""
    read -p "Press Enter to continue once you've created the .env file..."
fi

echo -e "${GREEN}✓${NC} Environment configuration ready"

# Step 3: Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

echo -e "${GREEN}✓${NC} Dependencies installed"

# Step 4: Generate Prisma Client
echo ""
echo "🔧 Generating Prisma client..."
cd apps/admin-ui
npx prisma generate

echo -e "${GREEN}✓${NC} Prisma client generated"

# Step 5: Run database migrations
echo ""
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

echo -e "${GREEN}✓${NC} Database migrations completed"

# Step 6: Build the application
echo ""
echo "🏗️  Building application..."
cd ../..
npm run build

echo -e "${GREEN}✓${NC} Build completed successfully"

# Summary
echo ""
echo "========================================"
echo -e "${GREEN}✅ Deployment setup complete!${NC}"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Review the .env file to ensure all credentials are correct"
echo "2. Update Google OAuth consent screen with Gmail API scopes"
echo "3. Start the application: npm run start"
echo ""
echo "For detailed deployment instructions, see DEPLOYMENT_GUIDE.md"
echo ""
