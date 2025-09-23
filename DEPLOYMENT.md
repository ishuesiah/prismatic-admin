# Prismatic Admin Deployment Guide

A comprehensive admin panel built with Next.js, NextAuth.js, Prisma, and TypeScript for Hemlock & Oak.

## Features

✅ **User Management**
- Google OAuth authentication
- Role-based access control (SUPERADMIN, ADMIN, STAFF, VIEWER)
- User invitations and profile management
- Audit logging

✅ **Modern Architecture**
- Next.js 15 with App Router
- TypeScript for type safety
- Turbo monorepo structure
- Prisma ORM with PostgreSQL
- Radix UI components with Tailwind CSS

✅ **API Integration Ready**
- ShipStation, Shopify, Klaviyo, Slack connectors
- Encrypted credential storage
- Health check monitoring

✅ **Onboarding System**
- Dynamic workflow builder
- Progress tracking
- Role-based onboarding

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Google Cloud Console project
- Domain with hemlockandoak.com email access

## 1. Environment Setup

### Database Setup
Create a PostgreSQL database for your application:

```sql
CREATE DATABASE prismatic_admin;
CREATE USER prismatic_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE prismatic_admin TO prismatic_user;
```

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `https://yourdomain.com/api/auth/callback/google`
5. Note your Client ID and Client Secret

### Environment Variables
Create `apps/admin-ui/.env.local`:

```env
# Database
DATABASE_URL="postgresql://prismatic_user:your_secure_password@localhost:5432/prismatic_admin"

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-secret-here-generate-with-openssl-rand-base64-32"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Encryption (generate with: openssl rand -base64 32)
ENCRYPTION_KEY="your-32-byte-encryption-key"

# Optional: Redis for sessions
REDIS_URL="redis://localhost:6379"

# Optional: File storage
S3_ACCESS_KEY_ID="your-access-key"
S3_SECRET_ACCESS_KEY="your-secret-key"
S3_BUCKET_NAME="your-bucket-name"
S3_REGION="us-east-1"

# API Keys (add when ready)
SHOPIFY_APP_API_KEY=""
SHOPIFY_APP_SECRET=""
KLAVIYO_API_KEY=""
SLACK_BOT_TOKEN=""
SHIPSTATION_API_KEY=""
SHIPSTATION_API_SECRET=""
```

## 2. Local Development

### Install Dependencies
```bash
npm install
```

### Database Setup
```bash
# Generate Prisma client
cd apps/admin-ui
npm run db:generate

# Push schema to database
npm run db:push

# Seed initial data (creates admin user)
npm run db:seed
```

### Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` and sign in with `info@hemlockandoak.com`

## 3. Deployment on Kinsta

### Prepare for Production

1. **Build the application:**
```bash
npm run build
```

2. **Environment Variables on Kinsta:**
   - Add all environment variables from `.env.local`
   - Update `NEXTAUTH_URL` to your production domain
   - Use production database URL

3. **Database Migration:**
```bash
npx prisma db push
npx prisma db seed
```

### Kinsta Configuration

**Build Settings:**
- Build command: `npm run build`
- Start command: `npm start`
- Node version: 18+
- Root directory: `apps/admin-ui`

**Environment Variables:**
Add all variables from your `.env.local` to Kinsta's environment variables section.

## 4. Post-Deployment Setup

### Initial Admin Setup
1. Visit your deployed URL
2. Sign in with `info@hemlockandoak.com`
3. Go to Profile Settings to update your information
4. Test user invitation system

### API Integrations
Navigate to Settings > Integrations to configure:

- **ShipStation:** Add API key and secret
- **Shopify:** Configure app credentials
- **Klaviyo:** Add API key
- **Slack:** Set up bot token

## 5. Security Checklist

- [ ] Strong `NEXTAUTH_SECRET` generated
- [ ] Database credentials secured
- [ ] Google OAuth configured for production domain
- [ ] HTTPS enabled on your domain
- [ ] Environment variables set in Kinsta
- [ ] Database backups configured

## 6. Features Available

### User Management
- `/users` - User list and invitation system
- `/settings/profile` - Profile management
- Role-based permissions system

### Navigation
- Dashboard with analytics overview
- Blog Editor (ready for content creation)
- Mind Maps (for workflow visualization)
- Onboarding management
- Integration settings

### API Endpoints
- `GET /api/users` - List users with pagination/search
- `POST /api/users/invite` - Send user invitations
- `GET/PATCH /api/users/profile` - Profile management

## 7. Monitoring and Maintenance

### Health Checks
The application includes built-in monitoring for:
- Database connectivity
- API integration status
- Authentication system health

### Logs
- User actions are logged in the audit system
- API errors are captured with stack traces
- Authentication attempts are monitored

## 8. Troubleshooting

### Common Issues

**OAuth Error:**
- Verify Google Cloud Console redirect URIs
- Check `NEXTAUTH_URL` matches your domain

**Database Connection:**
- Verify `DATABASE_URL` format
- Ensure database server is accessible

**Permission Errors:**
- Check user roles in database
- Verify domain restrictions in constants

### Support
For deployment assistance, check the GitHub repository issues or contact the development team.

## Next Steps

1. **Content Management:** Set up blog editor with Shopify integration
2. **Analytics:** Configure dashboard analytics
3. **Onboarding Flows:** Create role-specific onboarding workflows
4. **Advanced Integrations:** Set up Klaviyo email automation
5. **Mind Maps:** Build workflow visualization tools

Your admin panel is now ready for production use with a solid foundation for future enhancements!
