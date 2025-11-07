# Blog Database Setup Guide

## ✅ Database Already Configured!

Your blog posts are **already being saved to a PostgreSQL database** via Prisma ORM.

## 📊 Database Schema

The `BlogPost` model is already defined in your Prisma schema (`apps/admin-ui/prisma/schema.prisma`):

```prisma
model BlogPost {
  id               String     @id @default(cuid())
  userId           String
  title            String
  slug             String     @unique
  content          Json       // TipTap content stored as JSON
  excerpt          String?
  featuredImage    String?
  seo              Json?
  status           PostStatus @default(DRAFT)
  publishedAt      DateTime?
  shopifyArticleId String?
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt
  
  author           User       @relation(fields: [userId], references: [id])
}
```

## 🗄️ Where Posts Are Saved

**Database**: PostgreSQL  
**Connection**: Via `DATABASE_URL` in `.env.local`  
**Current DB**: `postgresql://tiarambaran@localhost:5432/prismatic_admin_dev`

All blog posts are automatically saved to the `BlogPost` table in this database when you:
- Click "Save Draft" or "Publish" in the editor
- Create a new post
- Edit an existing post

## 🔧 Database Setup Steps

### 1. Make Sure PostgreSQL is Running
```bash
# Check if PostgreSQL is running
pg_isready

# If not running, start it (macOS with Homebrew):
brew services start postgresql
```

### 2. Database Already Exists
Your database `prismatic_admin_dev` is already configured and connected.

### 3. Apply Prisma Migrations (if needed)
If you need to sync your database schema:
```bash
cd apps/admin-ui
npx prisma db push
```

### 4. View Your Data
You can use Prisma Studio to view and edit your blog posts:
```bash
cd apps/admin-ui
npm run db:studio
```

This will open a web interface at `http://localhost:5555` where you can see all your blog posts.

## 📝 How Saving Works

### Creating a New Post:
1. You write content in the editor
2. Click "Save Draft" or "Publish"
3. POST request sent to `/api/blog`
4. Prisma creates a new `BlogPost` record in PostgreSQL
5. You're redirected to the edit page

### Editing an Existing Post:
1. You modify the content
2. Click "Save Draft" or "Publish"
3. PUT request sent to `/api/blog/[id]`
4. Prisma updates the existing `BlogPost` record
5. Changes are saved to the database

## 🔍 What Gets Saved

- **Title** & **Slug**
- **Content** (as TipTap JSON format)
- **Excerpt** (optional summary)
- **SEO metadata** (meta title, meta description)
- **Featured image** URL
- **Status** (DRAFT, PUBLISHED, SCHEDULED)
- **Published date**
- **Author** (your user ID)
- **Shopify article ID** (when published to Shopify)
- **Timestamps** (created, updated)

## 🚀 API Endpoints

Your blog uses these API routes (already implemented):

- `GET /api/blog` - List all posts
- `POST /api/blog` - Create new post
- `GET /api/blog/[id]` - Get single post
- `PUT /api/blog/[id]` - Update post
- `DELETE /api/blog/[id]` - Delete post
- `POST /api/blog/analyze-seo` - AI SEO analysis

## 💡 Summary

**You don't need to set up a database** - it's already working! Your blog posts are being saved to PostgreSQL automatically. You can:

1. ✅ Create and edit posts
2. ✅ Posts are saved to the database
3. ✅ View posts at `/blog`
4. ✅ Use Prisma Studio to inspect data
5. ✅ Everything is backed up in your database

The only thing you might want to add is:
- Claude API key for SEO analysis (optional)
- Shopify credentials for publishing to Shopify (optional)

Your blog editor is fully functional and saving to the database right now! 🎉
