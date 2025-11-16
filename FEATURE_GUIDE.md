# Feature Guide - Intelligent Customer Service Platform

Quick reference for using the new email responder features.

## 🚀 Quick Start

### Initial Setup (One Time)

1. **Run Deployment Script**
   ```bash
   ./setup-deployment.sh
   ```

2. **Sign In with Google**
   - You'll be prompted to grant Gmail API permissions
   - Required scopes: gmail.readonly, gmail.send, gmail.modify, gmail.labels

3. **Configure API Credentials**
   - Go to Settings → API Credentials
   - Add Shopify credentials (optional)
   - Add ShipStation credentials (optional)
   - Add Anthropic API key (required for AI features)

## 📧 Email Management Workflow

### Step 1: Sync Emails from Gmail

**Location:** Email Responder page

**Action:** Click "Sync from Gmail" button

**What it does:**
- Fetches latest emails from your Gmail inbox
- Automatically extracts customer names
- Detects and extracts order numbers
- Stores emails in database for processing

**Expected time:** ~1-2 seconds per 10 emails

### Step 2: AI-Powered Grouping

**Action:** Click "Group Emails" button

**What it does:**
- Analyzes all emails using Claude 3.5 Sonnet
- Categorizes into 5 groups:
  - 🔴 **PRIORITY** - Damaged items, wrong orders, urgent issues
  - 📦 **ORDER_STATUS** - Shipping inquiries, tracking requests
  - 🏢 **WHOLESALE** - B2B inquiries
  - ✅ **NO_ACTION** - Thank you notes, confirmations
  - 📁 **OTHER** - Uncategorized

- Assigns urgency scores (1-10)
- Detects sentiment (positive/neutral/negative/frustrated)
- Identifies key issues
- Suggests response tone

**Expected time:** ~2-4 seconds for 20 emails

### Step 3: Review and Respond

**Action:** Click on any email card to open detail modal

**Modal Tabs:**

#### 📨 Email Tab
- View full email content
- See AI insights:
  - Urgency score with visual indicator
  - Sentiment analysis
  - Key issues extracted
  - Suggested response tone
  - Similarity tags for grouping
- Customer name and email
- Order number (if detected)

#### 📦 Order Tab
- **Shopify Integration**
  - Automatically fetches order details
  - Shows order status, items, shipping address
  - Displays fulfillment status
  - Shows mock data if Shopify not configured

- **ShipStation Tagging**
  - Click "Tag as HOLD" to pause order
  - Click "Tag as PRIORITY" to prioritize order
  - Tags sync immediately to ShipStation
  - Visual confirmation when tag is applied

#### 💬 Comments Tab
- **Internal Team Collaboration**
  - Add comments visible only to team
  - @mention team members (coming soon)
  - View comment history
  - See who commented and when
  - Edit/delete your own comments

### Step 4: Bulk Operations

**Select Multiple Emails:**
- Click checkbox on individual emails
- Or click "Select All" for a group

**Bulk Reply:**
- Click "Bulk Reply" button
- Write response template
- Emails are sent via Gmail API
- All recipients receive personalized emails

## 🎯 AI Insights Explained

### Urgency Score (1-10)
- **9-10** 🔴 Critical - Wrong/damaged items, fraud, threats
- **7-8** 🟠 High - Delayed orders, missing items
- **4-6** 🟡 Medium - General inquiries, tracking requests
- **1-3** 🟢 Low - Thank you notes, positive feedback

### Sentiment Analysis
- **Positive** 😊 - Happy customers, compliments
- **Neutral** 😐 - Standard inquiries, questions
- **Negative** 😟 - Unhappy customers, complaints
- **Frustrated** 😤 - Angry customers, threats to leave

### Key Issues
AI extracts main concerns from each email:
- "damaged product"
- "missing items"
- "tracking not updating"
- "wholesale pricing inquiry"

### Suggested Tone
AI recommends response approach:
- "empathetic and apologetic" - For complaints
- "professional and informative" - For inquiries
- "warm and grateful" - For positive feedback
- "urgent and solution-focused" - For critical issues

## 🔍 Debug Console

**Access:** Click floating debug icon (bottom-right)

**Features:**
- **Real-time Logs** - See all API calls and responses
- **Filtering**
  - By level: error, warn, success, info, debug
  - By category: Gmail, AI, Shopify, ShipStation, BulkReply
- **Export** - Download logs as JSON for troubleshooting
- **Statistics** - View error rates, success rates
- **Clear** - Clear old logs

**When to Use:**
- Debugging API integration issues
- Monitoring AI grouping quality
- Checking Shopify/ShipStation sync status
- Troubleshooting email send failures

## 💡 Pro Tips

### Efficient Workflow
1. Sync emails once per day (morning)
2. Group emails with AI
3. Tackle PRIORITY group first
4. Use bulk reply for ORDER_STATUS group
5. Archive NO_ACTION emails

### Best Practices
- **Review AI Insights** - Check urgency scores before responding
- **Use Comments** - Coordinate with team on complex issues
- **Tag Orders** - Use HOLD for issues, PRIORITY for VIPs
- **Check Shopify** - Verify order status before responding
- **Personalize Bulk Replies** - Use customer name variables

### Keyboard Shortcuts (Coming Soon)
- `Ctrl+K` - Open command palette
- `G` then `I` - Go to inbox sync
- `G` then `G` - Go to grouping
- `Esc` - Close modal
- `/` - Search emails

## 🔐 Multi-User Awareness

The system recognizes different team members:
- **jess@hemlockandoak.com** - Shows as "Jess"
- Each user sees their own inbox
- Comments show user name and avatar
- Actions are attributed to logged-in user

## 🛠️ Troubleshooting

### Emails Not Syncing
1. Check debug console for errors
2. Verify Gmail OAuth tokens are valid
3. Re-authenticate if needed: Settings → Account → Reconnect Gmail

### AI Grouping Errors
1. Check ANTHROPIC_API_KEY in environment
2. Verify API key has sufficient credits
3. Check debug console for API errors
4. Reduce batch size (group fewer emails at once)

### Shopify Not Loading
1. Verify SHOPIFY_STORE_URL and SHOPIFY_ACCESS_TOKEN
2. Check store has necessary API permissions
3. Order number must exactly match Shopify format
4. System shows mock data if Shopify unavailable

### ShipStation Tags Not Applying
1. Verify SHIPSTATION_API_KEY and SHIPSTATION_API_SECRET
2. Check order exists in ShipStation
3. Order must be in "awaiting_shipment" status
4. Tags are case-sensitive (use HOLD, PRIORITY)

### Comments Not Saving
1. Check you're logged in (session active)
2. Verify database connection
3. Check browser console for errors
4. Comment must have content (not empty)

## 📊 Feature Comparison

| Feature | Old System | New System |
|---------|-----------|------------|
| **Email Source** | CSV from commslayer | Direct Gmail sync |
| **Grouping** | Manual by keyword | AI-powered semantic analysis |
| **Order Lookup** | Manual search | Auto-fetch from Shopify |
| **ShipStation** | Manual login | One-click tagging |
| **Team Collab** | Email/Slack | Built-in comments |
| **Insights** | None | Urgency, sentiment, issues |
| **Bulk Reply** | Copy-paste | Personalized templates |

## 🎓 Training Resources

### For New Team Members
1. Watch onboarding video (coming soon)
2. Practice with test emails
3. Review this guide
4. Shadow experienced team member
5. Start with low-urgency emails

### For Managers
- Monitor response times via debug console
- Review team comments for quality assurance
- Track AI accuracy (flag incorrect groupings)
- Export logs for performance analysis

## 🚀 Coming Soon

- [ ] Automated response templates
- [ ] Multi-language detection and response
- [ ] Email analytics dashboard
- [ ] Slack integration for notifications
- [ ] Mobile app for on-the-go responses
- [ ] AI-suggested responses (full drafts)
- [ ] Customer sentiment tracking over time
- [ ] Automated workflow triggers

## 📞 Support

**Questions?** Check the debug console first, then contact:
- Technical issues: dev@example.com
- Feature requests: GitHub Issues
- Documentation: DEPLOYMENT_GUIDE.md

---

**Last Updated:** 2025-11-16
**Version:** 1.0.0
**Branch:** claude/review-bulk-email-responder-017UrQMadpRu2evxVygQs87u
