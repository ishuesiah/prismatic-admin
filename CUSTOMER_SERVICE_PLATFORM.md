# Customer Service Platform - Complete Feature Guide

## Overview

A comprehensive, AI-powered customer service platform that replaces commslayer with intelligent email management, automated responses, and seamless integrations with Gmail, Shopify, and ShipStation.

## Key Features

### 1. AI-Powered Intelligent Email Grouping 🤖

**What it does:**
- Analyzes emails using Claude AI for semantic understanding
- Groups similar emails together by issue type and product
- Extracts customer names and order numbers intelligently
- Rates urgency (1-10) and sentiment automatically
- Provides key issues and suggested response tone

**Categories:**
- **PRIORITY**: Damaged items, wrong items, urgent issues (red highlight, auto-expanded)
- **ORDER_STATUS**: Tracking, shipping, order inquiries (blue)
- **WHOLESALE**: Business and bulk purchase inquiries (purple)
- **NO_ACTION**: Thank you messages, positive feedback (green)
- **OTHER**: General inquiries (gray)

**AI Insights per Email:**
- Urgency score (1-10)
- Sentiment (positive, neutral, negative, frustrated)
- Key issues extraction
- Suggested response tone
- Similarity tags for clustering

---

### 2. Gmail Integration 📧

**Replaces commslayer CSV workflow entirely!**

**Setup:**
1. Sign out of the application
2. Sign in again - you'll be prompted to grant Gmail permissions
3. Click "Sync Gmail" to pull emails from your inbox

**What it does:**
- Syncs emails directly from Gmail (no CSV needed!)
- Bidirectional sync - replies sent from the platform appear in Gmail
- Marks emails as actioned automatically
- Extracts names, order numbers, and creates conversation threads
- Real-time sync status display

**API Endpoints:**
- `GET /api/gmail/sync` - Check connection status
- `POST /api/gmail/sync` - Sync emails from Gmail inbox

---

### 3. Bulk Reply Functionality 📬

**Workflow:**
1. AI generates responses for all emails
2. Review and edit responses as needed
3. Select emails using checkboxes
4. Click "Send X Replies" button
5. Emails sent via Gmail API automatically

**Features:**
- Select individual emails or entire groups
- Sends through Gmail (appears in Sent folder)
- Tracks sent/failed status
- Automatically marks emails as "actioned"

**API Endpoint:**
- `POST /api/email-responder/bulk-reply`

---

### 4. Shopify Integration 🛍️

**What it does:**
- Automatically looks up orders by order number
- Shows customer details, order items, fulfillment status
- Displays tracking information
- Uses real Shopify data when configured, falls back to mock data

**Setup:**
```env
SHOPIFY_STORE_URL="your-store.myshopify.com"
SHOPIFY_ACCESS_TOKEN="shpat_..."
```

**API Endpoint:**
- `GET /api/email-responder/shopify?orderNumber=12345&emailId=xxx`

---

### 5. ShipStation Tagging ⚡

**One-click order tagging!**

**Available Tags:**
- **HOLD**: Put order on hold
- **PRIORITY**: Rush this order
- **URGENT**: Highest priority
- **REVIEW**: Needs review

**Workflow:**
1. Open email details modal
2. Click "Order" tab
3. Click "Tag as HOLD" or "Tag as PRIORITY"
4. Order immediately tagged in ShipStation

**Setup:**
```env
SHIPSTATION_API_KEY="your-api-key"
SHIPSTATION_API_SECRET="your-api-secret"
```

**API Endpoints:**
- `GET /api/shipstation/tag?orderNumber=12345` - Get order
- `POST /api/shipstation/tag` - Add tag to order
- `DELETE /api/shipstation/tag?orderNumber=12345&tag=HOLD` - Remove tag

---

### 6. Email Details Modal 🔍

**Click the maximize icon on any email to open detailed view.**

**Tabs:**

#### Email Tab
- Full message text
- AI-generated response
- Edit and save responses

#### Order Tab (if order number detected)
- Customer information
- Order items with quantities and prices
- Fulfillment status and tracking
- One-click HOLD/PRIORITY tagging buttons

#### Comments Tab
- Team collaboration on emails
- Internal notes and discussions
- User attribution with timestamps
- Comment history

---

### 7. Team Collaboration 💬

**Features:**
- Leave internal comments on any email
- See who's viewing/working on emails
- User awareness - shows current logged-in user
- Comment notifications and history

**API Endpoints:**
- `GET /api/email-responder/comments?emailId=xxx` - Get comments
- `POST /api/email-responder/comments` - Add comment
- `DELETE /api/email-responder/comments?commentId=xxx` - Delete comment

---

### 8. Smart Name & Order Extraction 🔎

**Automatically extracts:**

**Customer Names:**
- From email signatures: "Thanks, John Doe"
- From "Name <email@example.com>" format
- From message context

**Order Numbers:**
- Patterns: #12345, Order #12345, order 12345
- 5-6 digit numbers in messages
- Updates database automatically

---

## Architecture

### Database Schema

```prisma
model EmailCorrespondence {
  id               String    @id
  ticketId         String    @unique
  conversationId   String    // Gmail thread ID
  subject          String
  fromEmail        String
  fromName         String?   // AI-extracted
  messageText      String
  orderNumber      String?   // AI-extracted
  shopifyData      Json?     // Cached order data
  shipstationData  Json?     // Tagging history
  aiInsights       Json?     // Urgency, sentiment, issues
  autoResponse     String?
  needsAction      Boolean
  groupId          String?
  userId           String
  comments         EmailComment[]
}

model EmailComment {
  id          String   @id
  emailId     String
  userId      String
  content     String
  isInternal  Boolean  @default(true)
  createdAt   DateTime
}

model EmailGroup {
  id          String   @id
  name        String
  type        GroupType // PRIORITY, ORDER_STATUS, etc.
  priority    Int
  emails      EmailCorrespondence[]
}
```

### API Routes

```
/api/email-responder/
  ├─ upload (POST)           - Upload CSV emails
  ├─ group (POST/GET)        - Group emails with AI
  ├─ generate (POST)         - Generate AI responses
  ├─ save-response (POST)    - Save edited response
  ├─ comments (GET/POST/DELETE) - Team comments
  ├─ shopify (GET)           - Order lookup
  └─ bulk-reply (POST)       - Send bulk emails

/api/gmail/
  └─ sync (GET/POST)         - Gmail sync service

/api/shipstation/
  └─ tag (GET/POST/DELETE)   - Order tagging
```

---

## Setup Instructions

### 1. Database Migration

```bash
cd apps/admin-ui
npx prisma migrate dev --name add-ai-features
npx prisma generate
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
# Required
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
CLAUDE_API_KEY="sk-ant-..."

# Optional
SHOPIFY_STORE_URL="..."
SHOPIFY_ACCESS_TOKEN="..."
SHIPSTATION_API_KEY="..."
SHIPSTATION_API_SECRET="..."
```

### 3. Google Cloud Console Setup

**Enable Gmail API:**
1. Go to https://console.cloud.google.com/
2. Create/select project
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add authorized redirect: `http://localhost:3000/api/auth/callback/google`
6. Add scopes:
   - `gmail.readonly`
   - `gmail.send`
   - `gmail.modify`
   - `gmail.labels`

### 4. Anthropic API Key

1. Go to https://console.anthropic.com/
2. Create API key
3. Add to `.env` as `CLAUDE_API_KEY`

### 5. Shopify Setup (Optional)

1. Admin → Settings → Apps and sales channels → Develop apps
2. Create app with permissions:
   - `read_orders`
   - `read_customers`
3. Install app and copy access token

### 6. ShipStation Setup (Optional)

1. Go to https://ss.shipstation.com/#/settings/api
2. Generate API Key/Secret
3. Add to `.env`

---

## Usage Guide

### First Time Setup

1. **Sign in with Google**
   - Grants Gmail access automatically
   - Shows your email in top-right corner

2. **Sync Gmail**
   - Click "Sync Gmail" button
   - Imports last 100 emails from inbox
   - Automatically groups with AI

3. **Generate Responses**
   - Click "Generate All Responses"
   - AI creates personalized responses
   - Edit as needed

4. **Bulk Reply**
   - Check boxes next to emails
   - Click "Send X Replies"
   - Sent via Gmail API

### Daily Workflow

1. **Morning:** Click "Sync Gmail" to get new emails
2. **Review:** Check PRIORITY group first (red highlight)
3. **Tag Orders:** For urgent issues, tag in ShipStation as HOLD/PRIORITY
4. **Respond:** Select emails, click "Send Replies"
5. **Collaborate:** Leave comments for team members

### For Jess@hemlockandoak.com

The platform automatically detects the logged-in user:
- Shows "jess@hemlockandoak.com" in top-right
- All emails, comments, and actions are user-specific
- Team members can collaborate on same emails

---

## AI Prompting

### Email Grouping Prompt

The AI analyzes each email for:
- **Category**: PRIORITY, ORDER_STATUS, WHOLESALE, NO_ACTION, OTHER
- **Urgency**: 1-10 scale
- **Sentiment**: positive, neutral, negative, frustrated
- **Customer name**: Extracted from signature
- **Order number**: All formats (#12345, Order 12345, etc.)
- **Key issues**: Array of problems/topics
- **Suggested tone**: apologetic, informative, friendly, professional
- **Similarity tags**: For clustering similar emails

### Response Generation

Uses:
- Custom instructions (your brand voice)
- Response rules (conditional templates)
- Order details (from Shopify)
- Email context and history

---

## Performance

### AI Costs (Claude Sonnet)

- **Grouping**: ~500 tokens/email = $0.003 per email
- **Response**: ~1000 tokens/email = $0.006 per email
- **100 emails**: ~$0.90 total

### Batch Processing

- Grouping: 15 emails per batch
- Response: 5 emails per batch
- Gmail sync: 100 emails per sync

---

## Security

- NextAuth 5 with Google OAuth
- User isolation (all data scoped to userId)
- Gmail access tokens stored securely
- API credentials encrypted in database
- Role-based permissions

---

## Troubleshooting

### Gmail not syncing
- **Issue**: "Gmail not connected"
- **Fix**: Sign out and sign in again to grant permissions

### Shopify not working
- **Issue**: Mock data shown
- **Fix**: Add `SHOPIFY_STORE_URL` and `SHOPIFY_ACCESS_TOKEN` to `.env`

### ShipStation tagging fails
- **Issue**: "Failed to tag order"
- **Fix**: Verify `SHIPSTATION_API_KEY` and `SHIPSTATION_API_SECRET`

### AI grouping not working
- **Issue**: Basic keyword grouping
- **Fix**: Verify `CLAUDE_API_KEY` is set correctly

---

## Roadmap

**Completed** ✅
- AI-powered email grouping
- Gmail integration
- Bulk reply
- Shopify order lookup
- ShipStation tagging
- Team comments
- Email details modal
- Multi-user support

**Future Enhancements** 🚀
- Auto-reply for simple questions
- Email templates library
- Canned responses
- Email analytics dashboard
- Sentiment tracking over time
- Customer history view
- Mobile app

---

## Support

For issues or questions:
1. Check this guide first
2. Review the code comments
3. Check environment variables
4. Verify API credentials

---

## Credits

Built with:
- Next.js 15
- NextAuth 5
- Anthropic Claude 3.5 Sonnet
- Prisma ORM
- Gmail API
- Shopify Admin API
- ShipStation API
