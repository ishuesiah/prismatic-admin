# Debugging Guide - Customer Service Platform

## Overview

The customer service platform includes comprehensive debugging capabilities to help troubleshoot issues with Gmail sync, AI grouping, bulk replies, and integrations.

## Debug Panel

### Accessing the Debug Panel

Look for the **Terminal icon** (🖥️) in the bottom-right corner of the email responder page. Click it to open the debug console.

### Features

#### 1. Real-time Log Viewing
- Logs update every 2 seconds automatically
- Color-coded by severity:
  - ❌ **Red** = Errors
  - ⚠️ **Yellow** = Warnings
  - ✅ **Green** = Success
  - ℹ️ **Blue** = Info
  - 🔍 **Purple** = Debug

#### 2. Filtering
- **By Level**: Filter to see only errors, warnings, etc.
- **By Category**: View logs from specific components:
  - Gmail
  - AI
  - Shopify
  - ShipStation
  - BulkReply

#### 3. Log Details
- Click any log entry to expand and see detailed data
- View JSON payloads, error stacks, and API responses

#### 4. Export & Clear
- **Download** button: Export all logs as JSON
- **Trash** button: Clear all logs
- **Refresh** button: Manually reload logs

### Log Statistics Footer
Shows counts for each log level at a glance

---

## Common Debugging Scenarios

### 1. Gmail Sync Not Working

**Symptoms:**
- "Gmail not connected" error
- No emails syncing

**Debug Steps:**

1. Open Debug Panel
2. Filter by Category: **Gmail**
3. Look for error logs

**Common Issues:**

```
❌ [Gmail] No Gmail access token found for user
```
**Solution**: Sign out and sign in again to grant Gmail permissions

```
❌ [Gmail] Gmail API list request failed - status: 401
```
**Solution**: Access token expired. Sign out/in to refresh

```
⚠️ [Gmail] No new messages found to sync
```
**Not an error**: This means inbox is already synced

**Expected Successful Flow:**
```
ℹ️ [Gmail] Starting Gmail sync for user: jess@hemlockandoak.com
✅ [Gmail] Gmail access token retrieved
ℹ️ [Gmail] Found 47 messages to process
ℹ️ [Gmail] Processing 47 messages
🔍 [Gmail] Processing message abc123def456
✅ [Gmail] Sync completed: 35 new, 12 skipped
```

---

### 2. AI Grouping Issues

**Symptoms:**
- Emails not being categorized correctly
- No AI insights showing
- Groups missing

**Debug Steps:**

1. Open Debug Panel
2. Filter by Category: **AI**
3. Check for Claude API errors

**Common Issues:**

```
❌ [AI] AI analysis error: API key not found
```
**Solution**: Add `CLAUDE_API_KEY` to `.env`

```
❌ [AI] Failed to parse AI response
```
**Solution**: Claude API might be rate-limited or returned unexpected format

**Expected Successful Flow:**
```
ℹ️ [AI] AI-powered grouping for 50 emails...
ℹ️ [AI] Processing batch 1/4
✅ [AI] AI analyzed 15 emails successfully
ℹ️ [AI] Processing batch 2/4
✅ [AI] AI analyzed 15 emails successfully
...
```

---

### 3. Bulk Reply Failures

**Symptoms:**
- "Failed to send bulk replies"
- Some emails not sending

**Debug Steps:**

1. Open Debug Panel
2. Filter by Category: **BulkReply**
3. Check for Gmail API errors

**Common Issues:**

```
❌ [BulkReply] No response available for this email
```
**Solution**: Generate AI responses first before sending

```
❌ [BulkReply] Failed to send email xyz789: Daily sending quota exceeded
```
**Solution**: Gmail has daily sending limits (500 for regular accounts)

**Expected Successful Flow:**
```
ℹ️ [BulkReply] Starting bulk reply for 15 emails
🔍 [BulkReply] Sending reply to customer@example.com
✅ [BulkReply] Sent reply to customer@example.com (Message ID: abc123)
...
✅ [BulkReply] Bulk reply completed: 15 sent, 0 failed
```

---

### 4. ShipStation Tagging Issues

**Symptoms:**
- "Failed to tag order"
- Tags not appearing in ShipStation

**Debug Steps:**

1. Open Debug Panel
2. Filter by Category: **ShipStation**
3. Look for API errors

**Common Issues:**

```
❌ [ShipStation] ShipStation API credentials not configured
```
**Solution**: Add `SHIPSTATION_API_KEY` and `SHIPSTATION_API_SECRET` to `.env`

```
❌ [ShipStation] Order not found in ShipStation
```
**Solution**: Order number might be incorrect or order not yet in ShipStation

```
❌ [ShipStation] Failed to add tag: 401 Unauthorized
```
**Solution**: API credentials are invalid

**Expected Successful Flow:**
```
ℹ️ [ShipStation] Looking up order 12345
✅ [ShipStation] Found order 12345 in ShipStation
ℹ️ [ShipStation] Adding tag PRIORITY to order 12345
✅ [ShipStation] Successfully tagged order 12345 with PRIORITY
```

---

### 5. Shopify Integration Issues

**Symptoms:**
- Mock data showing instead of real orders
- "Failed to fetch order" errors

**Debug Steps:**

1. Open Debug Panel
2. Filter by Category: **Shopify**
3. Check for API connection issues

**Common Issues:**

```
⚠️ [Shopify] Shopify credentials not configured, using mock data
```
**Not an error**: Add credentials to use real data

```
❌ [Shopify] Shopify API error: 401 Unauthorized
```
**Solution**: `SHOPIFY_ACCESS_TOKEN` is invalid or expired

```
❌ [Shopify] Order not found in Shopify
```
**Solution**: Order number might be incorrect or order doesn't exist

**Expected Successful Flow:**
```
ℹ️ [Shopify] Fetching order 12345
✅ [Shopify] Order 12345 found in Shopify
ℹ️ [Shopify] Saving order data to database
✅ [Shopify] Order data saved for email abc123
```

---

## Browser Console Debugging

For additional debugging, open your browser's Developer Tools (F12):

### Gmail Sync
```javascript
// Check if access token exists
localStorage.getItem('debug_logs')

// Force refresh Gmail sync
fetch('/api/gmail/sync', { method: 'POST', body: JSON.stringify({ maxResults: 10 }) })
```

### Check Stored Logs
```javascript
// View all debug logs
JSON.parse(localStorage.getItem('debug_logs'))

// Count logs by level
const logs = JSON.parse(localStorage.getItem('debug_logs'))
logs.reduce((acc, log) => {
  acc[log.level] = (acc[log.level] || 0) + 1
  return acc
}, {})
```

### Clear Everything
```javascript
// Clear all logs
localStorage.removeItem('debug_logs')
```

---

## API Endpoint Testing

### Test Gmail Connection
```bash
curl -X GET http://localhost:3000/api/gmail/sync \
  -H "Cookie: your-session-cookie"
```

### Test Gmail Sync
```bash
curl -X POST http://localhost:3000/api/gmail/sync \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"maxResults": 10}'
```

### Test Shopify Lookup
```bash
curl -X GET "http://localhost:3000/api/email-responder/shopify?orderNumber=12345" \
  -H "Cookie: your-session-cookie"
```

### Test ShipStation Tag
```bash
curl -X POST http://localhost:3000/api/shipstation/tag \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"orderNumber": "12345", "tag": "HOLD"}'
```

---

## Performance Monitoring

### Check AI Response Times

Look for timing logs in the Debug Panel:
```
🔍 [AI] ⏱️ Starting: Analyze batch 1
✅ [AI] ⏱️ Completed: Analyze batch 1 (2340ms)
```

If times are > 5 seconds per batch:
- Batch size might be too large
- Claude API might be slow
- Network issues

### Check Gmail Sync Performance

```
ℹ️ [Gmail] Found 100 messages to process
... (processing logs) ...
✅ [Gmail] Sync completed: 87 new, 13 skipped
```

Time between start and completion should be ~30-60 seconds for 100 emails.

---

## Environment Variable Checklist

Ensure these are set in `.env`:

**Required:**
- ✅ `DATABASE_URL`
- ✅ `NEXTAUTH_SECRET`
- ✅ `GOOGLE_CLIENT_ID`
- ✅ `GOOGLE_CLIENT_SECRET`
- ✅ `CLAUDE_API_KEY`

**Optional (for full functionality):**
- ⚪ `SHOPIFY_STORE_URL`
- ⚪ `SHOPIFY_ACCESS_TOKEN`
- ⚪ `SHIPSTATION_API_KEY`
- ⚪ `SHIPSTATION_API_SECRET`

---

## Log Rotation

Logs are automatically managed:
- **In-memory**: Last 1,000 logs
- **LocalStorage**: Last 500 logs
- **Auto-cleanup**: Older logs are removed

To prevent browser storage bloat, logs older than a session are cleared on page refresh.

---

## Debug Mode

Enable debug mode for more verbose logging:

Add to `.env.local`:
```env
NEXT_PUBLIC_DEBUG_MODE=true
```

This will:
- Show all debug-level logs
- Log to browser console
- Include additional metadata

---

## Getting Help

If you encounter an issue not covered here:

1. **Export Logs**: Click Download in Debug Panel
2. **Check Browser Console**: F12 → Console tab
3. **Check Server Logs**: Terminal where `npm run dev` is running
4. **Document the issue**:
   - What you were trying to do
   - Error messages from Debug Panel
   - Steps to reproduce

---

## Tips

### Gmail Sync
- Sync pulls last 100 emails by default
- Modify `maxResults` parameter for more/less
- Use `query` parameter to filter (e.g., "is:unread")

### AI Grouping
- Processes in batches of 15 emails
- Each batch takes ~2-3 seconds
- Total time for 100 emails: ~30 seconds

### Bulk Reply
- Sends in series (not parallel) to avoid rate limits
- Gmail limit: 500 emails/day for regular accounts
- 2,000 emails/day for Google Workspace

### Rate Limits
- **Claude API**: 50 requests/minute
- **Gmail API**: 250 quota units/second
- **Shopify API**: 2 requests/second
- **ShipStation API**: 40 requests/minute

---

## Troubleshooting Checklist

Before asking for help, check:

1. ✅ Debug Panel shows what's happening?
2. ✅ Browser console has errors?
3. ✅ All environment variables set?
4. ✅ Signed in with Google account?
5. ✅ Gmail permissions granted?
6. ✅ API keys valid and active?
7. ✅ Network connection stable?
8. ✅ Database running and accessible?

---

## Advanced Debugging

### Enable Network Logging

In Debug Panel, you'll see:
- API request start
- API response received
- Request/response times
- Error details

### Custom Logging

Add your own logs in the code:

```typescript
import { logger } from '@/lib/debug'

// Info log
logger.info('MyComponent', 'User clicked button', { buttonId: 'submit' })

// Error log
logger.error('MyComponent', 'Failed to save', error)

// Success log
logger.success('MyComponent', 'Data saved successfully')

// Time a function
await logger.time('MyComponent', 'Fetch data', async () => {
  return await fetchData()
})
```

---

## Quick Reference

| Issue | Category | Common Fix |
|-------|----------|-----------|
| Gmail not syncing | Gmail | Re-authenticate |
| AI grouping fails | AI | Check CLAUDE_API_KEY |
| Bulk reply errors | BulkReply | Check Gmail quotas |
| ShipStation tags fail | ShipStation | Verify API credentials |
| Shopify shows mock data | Shopify | Add SHOPIFY credentials |
| Slow performance | All | Check network/API status |

---

Happy debugging! 🐛🔍
