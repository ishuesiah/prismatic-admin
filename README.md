# Prismatic Admin

A comprehensive web admin platform built with Next.js, featuring Google OAuth authentication, role-based access control, and integrations with Shopify, ShipStation, Klaviyo, and Slack.

## Features

✅ **Authentication & Authorization**
- Google OAuth integration
- Role-based access control (SUPERADMIN, ADMIN, STAFF, VIEWER)
- Domain-restricted access (@hemlockandoak.com)
- Invitation system for new users

✅ **Content Management**
- Rich text editor for Shopify blog posts
- SEO metadata management
- Draft/scheduled/published states
- Direct publishing to Shopify

✅ **Collaboration Tools**
- Mind mapping with React Flow
- Export to PNG/SVG/PDF
- Real-time collaboration (coming soon)

✅ **Onboarding System**
- Step-by-step workflows
- Progress tracking
- Role-specific onboarding paths
- Customizable content blocks

✅ **API Integrations**
- Shopify (blog posts, products, orders)
- ShipStation (shipping management)
- Klaviyo (email marketing)
- Slack (notifications)

✅ **Admin Features**
- User management and invitations
- Audit logging
- Analytics dashboard
- File uploads to S3/Cloudflare R2

## Tech Stack

- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5 (Auth.js)
- **Editor**: TipTap
- **Mind Maps**: React Flow
- **Queue**: BullMQ with Redis
- **File Storage**: AWS S3 / Cloudflare R2
- **Deployment**: Kinsta Application Hosting

## Project Structure

```
prismatic-admin/
├── apps/
│   └── admin-ui/         # Next.js application
│       ├── app/          # App router pages
│       ├── components/   # UI components
│       ├── lib/          # Utilities and configs
│       └── prisma/       # Database schema
├── packages/
│   ├── ui/              # Shared UI components
│   ├── lib/             # Shared utilities and types
│   ├── config/          # Shared configurations
│   └── connectors/      # API connectors
└── turbo.json           # Turborepo configuration
```

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Redis server
- Google OAuth credentials
- API keys for Shopify, ShipStation, Klaviyo, and Slack

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/ishuesiah/prismatic-admin.git
cd prismatic-admin
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example environment file and fill in your credentials:

```bash
cp apps/admin-ui/.env.example apps/admin-ui/.env
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_URL`: Your application URL
- `NEXTAUTH_SECRET`: Random secret (generate with `openssl rand -base64 32`)
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: From Google Cloud Console
- API keys for integrations (Shopify, Klaviyo, Slack, ShipStation)

### 4. Set up the database

```bash
cd apps/admin-ui
npx prisma generate
npx prisma db push
npx prisma db seed # Seeds superadmin user
```

### 5. Run development server

```bash
npm run dev
```

The application will be available at http://localhost:3000

## Deployment to Kinsta

### 1. Prepare for deployment

1. Push your code to GitHub
2. Create a Kinsta Application
3. Connect your GitHub repository

### 2. Configure build settings in Kinsta

**Build command:**
```bash
npm run build
```

**Start command:**
```bash
npm run start
```

**Build path:**
```
/
```

### 3. Set environment variables in Kinsta

Add all environment variables from `.env.example` in the Kinsta dashboard.

### 4. Set up database

1. Create a PostgreSQL database in Kinsta
2. Copy the connection string to `DATABASE_URL`
3. Run migrations via Kinsta's terminal or locally with the production database URL

### 5. Deploy

Kinsta will automatically deploy when you push to your main branch.

## Development Scripts

```bash
# Development
npm run dev         # Start development server
npm run build       # Build for production
npm run start       # Start production server
npm run lint        # Run ESLint
npm run format      # Format code with Prettier

# Database
npx prisma generate # Generate Prisma client
npx prisma db push  # Push schema to database
npx prisma studio   # Open Prisma Studio
npx prisma migrate dev # Create migration

# Monorepo
npm run clean      # Clean all build artifacts
```

## API Endpoints

- `/api/auth/*` - NextAuth endpoints
- `/api/blog/*` - Blog post CRUD operations
- `/api/users/*` - User management
- `/api/integrations/*` - Third-party API integrations
- `/api/webhooks/*` - Webhook receivers

## Security Features

- JWT-based sessions
- RBAC with fine-grained permissions
- Domain-restricted authentication
- Encrypted API credentials
- Rate limiting on API endpoints
- Comprehensive audit logging
- CSRF protection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

This project is proprietary software for Hemlock & Oak.

## Support

For issues or questions, please contact info@hemlockandoak.com
