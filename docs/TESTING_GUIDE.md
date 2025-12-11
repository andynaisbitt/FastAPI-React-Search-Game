# JFGI Complete Testing Guide

## Overview
This guide covers all testing procedures for the enhanced JFGI (JustFuckingGoogleIt) application with difficulty levels, analytics, leaderboards, and ad placement.

---

## Prerequisites

### 1. Environment Setup
```bash
# Ensure all dependencies are installed
npm install

# Verify environment variables in .env
# Required:
# - SESSION_SECRET
# - ADSENSE_ENABLED (true/false)
# - ADSENSE_CLIENT_ID (if ads enabled)
# - NODE_ENV (development/production)
```

### 2. Database Initialization
```bash
# The database will auto-initialize on first run
# Verify the database file is created:
# - data/urls.db

# To reset the database (CAUTION: Deletes all data):
rm data/urls.db
npm start
# Database will be recreated with new schema
```

### 3. Start the Application
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start

# Application should be running at:
# http://localhost:3000
```

---

## Test Suite 1: Difficulty System

### Test 1.1: Create URLs with Different Difficulties

**Steps:**
1. Navigate to homepage: `http://localhost:3000`
2. Enter a test URL: `https://www.google.com`
3. Select difficulty: **Simple (60s)**
4. Click "Shorten URL"
5. Verify shortened URL is created
6. Note the shortCode (e.g., `abc123`)

**Repeat for each difficulty:**
- ✅ Simple (60s, 2 hints max)
- ✅ Medium (120s, 3 hints max)
- ✅ Hard (180s, 5 hints max)
- ✅ Expert (300s, 10 hints max)

**Expected Results:**
- Each URL should be created successfully
- Different shortCodes for each URL
- Database should store difficulty level

**Verification:**
```bash
# Check database entries
sqlite3 data/urls.db "SELECT shortCode, difficulty, timeLimitSeconds FROM urls ORDER BY id DESC LIMIT 4;"

# Expected output:
# abc123|simple|60
# def456|medium|120
# ghi789|hard|180
# jkl012|expert|300
```

---

### Test 1.2: Custom Challenge Creation

**Steps:**
1. Navigate to homepage
2. Enter URL: `https://www.wikipedia.org`
3. Expand "Custom Challenge (Advanced)" section
4. Enter custom question: `What is the world's largest free online encyclopedia?`
5. Enter custom hints (one per line):
   ```
   It starts with W
   Founded in 2001
   Anyone can edit it
   ```
6. Select difficulty: **Hard**
7. Click "Shorten URL"

**Expected Results:**
- URL created with custom question
- Custom hints stored in database
- Game uses custom question instead of auto-generated one

**Verification:**
```bash
sqlite3 data/urls.db "SELECT challengeText, hints FROM urls WHERE shortCode = 'YOUR_SHORT_CODE';"

# Expected: Custom question and JSON array of hints
```

---

## Test Suite 2: Game Mechanics

### Test 2.1: Simple Difficulty Game

**Steps:**
1. Open shortened URL for Simple difficulty: `http://localhost:3000/shorturl/abc123`
2. Verify game loads correctly
3. Check timer shows **60 seconds**
4. Check difficulty badge shows **😊 Simple**
5. Click "Get a hint" button
6. Verify hint counter shows: `Get a hint (0/2 used)`
7. Click hint button again
8. Verify hint counter updates: `Get a hint (1/2 used)`
9. After 2 hints, button should show: `No more hints`
10. Perform search for target URL
11. Select correct URL
12. Check score calculation

**Expected Results:**
- Timer counts down from 60
- Maximum 2 hints available
- Correct answer awards points (base 10 + time bonus - hint penalty)
- Analytics session tracked

**Console Logs to Verify:**
```
[GAME] Initialized with difficulty: simple, time limit: 60s, max hints: 2
[GAME] Started session 1 for abc123 [Simple]
[GAME] Hint 1 requested for session 1
[GAME] Session 1 completed in 45.3s
```

---

### Test 2.2: Expert Difficulty Game

**Steps:**
1. Open Expert difficulty URL: `http://localhost:3000/shorturl/jkl012`
2. Verify timer shows **300 seconds** (5 minutes)
3. Verify difficulty badge shows **💀 Expert**
4. Verify max hints is **10**
5. Complete game and verify higher base score

**Expected Results:**
- Longer time limit
- More hints available
- Higher base score (100 points vs 10 for Simple)
- Time bonus calculated correctly

---

### Test 2.3: Game Timeout

**Steps:**
1. Open any difficulty URL
2. **Do not** perform any search or click anything
3. Wait for timer to reach 0
4. Verify "Time's up!" modal appears
5. Check console for analytics tracking

**Expected Results:**
- Modal displays timeout message
- Original URL revealed
- Analytics records outcome as "timeout"

**Verification:**
```bash
sqlite3 data/urls.db "SELECT outcome, completionTime, hintsUsed FROM url_analytics WHERE outcome = 'timeout' ORDER BY id DESC LIMIT 1;"

# Expected: timeout|NULL|0
```

---

## Test Suite 3: Analytics System

### Test 3.1: Session Tracking

**Steps:**
1. Open a shortened URL
2. Check browser console for session start log
3. Perform 3 searches
4. Use 2 hints
5. Submit correct answer
6. Complete game

**Verification:**
```bash
# Check analytics table
sqlite3 data/urls.db "SELECT id, shortCode, outcome, completionTime, hintsUsed, attempts, score FROM url_analytics ORDER BY id DESC LIMIT 1;"

# Expected output (example):
# 1|abc123|completed|45.3|2|3|78
```

**Expected Data:**
- `outcome`: "completed"
- `completionTime`: ~45 seconds
- `hintsUsed`: 2
- `attempts`: 3
- `score`: calculated based on difficulty

---

### Test 3.2: Analytics Summary

**Steps:**
1. Create a test URL with shortCode `test123`
2. Play the game 5 times with different outcomes:
   - 2 completions
   - 1 timeout
   - 1 failure
   - 1 abandonment (close tab mid-game)

**Verification:**
```bash
# Check summary statistics
sqlite3 data/urls.db "SELECT totalViews, totalCompletions, totalTimeouts, totalFailures, totalAbandonments FROM urls WHERE shortCode = 'test123';"

# Expected output:
# 5|2|1|1|1
```

**API Test:**
```bash
# Test analytics endpoint
curl http://localhost:3000/game/test123/analytics

# Expected JSON response with summary
```

---

## Test Suite 4: Leaderboard System

### Test 4.1: Leaderboard Entry

**Steps:**
1. Create a new URL with shortCode `leaderboard-test`
2. Complete the game successfully (get correct answer)
3. When end game modal appears, check if leaderboard option is available
4. Note: Current implementation sets `submitToLeaderboard: false` by default

**Manual Entry Test:**
```bash
# Add test leaderboard entries
sqlite3 data/urls.db

INSERT INTO leaderboard (shortCode, playerNickname, playerCountry, completionTime, hintsUsed, score, difficulty, completedAt)
VALUES
  ('test123', 'SpeedRunner', 'US', 25.5, 0, 150, 'expert', strftime('%s', 'now')),
  ('test123', 'HintMaster', 'UK', 45.2, 5, 80, 'hard', strftime('%s', 'now')),
  ('test123', 'Beginner', 'CA', 58.1, 3, 50, 'medium', strftime('%s', 'now'));

.quit
```

---

### Test 4.2: Leaderboard Page

**Steps:**
1. Navigate to: `http://localhost:3000/game/leaderboard/test123`
2. Verify leaderboard displays correctly
3. Check difficulty badge
4. Verify stats summary shows:
   - Total Attempts
   - Completions
   - Success Rate
   - Avg. Time

**Expected Results:**
- Top 3 entries show medals (🥇🥈🥉)
- Entries sorted by score (highest first)
- Stats cards display accurate summaries
- Professional styling with gradient backgrounds

---

### Test 4.3: Empty Leaderboard

**Steps:**
1. Create a new URL that has never been completed
2. Navigate to its leaderboard page
3. Verify empty state message displays

**Expected Results:**
```
📊 No completions yet. Be the first to complete this challenge!
```

---

## Test Suite 5: Ad Placement System

### Test 5.1: Ad Strategy Calculation

**Steps:**
1. Enable ads in `.env`: `ADSENSE_ENABLED=true`
2. Create URLs with different difficulties:
   - Simple (60s) → Should show interstitial only
   - Medium (120s) → Should show sidebar + interstitial
   - Hard/Expert (180s+) → Should show banner + sidebar + interstitial

**Verification:**
```bash
# Check ad placements in rendered HTML
curl http://localhost:3000/shorturl/YOUR_SHORT_CODE | grep "ad-placeholder"

# Expected for Hard difficulty:
# - <div class="ad-banner-before">
# - <aside class="ad-sidebar">
# - <div id="adInterstitial">
```

---

### Test 5.2: Ad Impression Tracking

**Manual Console Test:**
```javascript
// Open browser console on game page
// Simulate ad impression
fetch('/game/ad/impression', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
  },
  body: JSON.stringify({
    placementType: 'sidebar_during'
  })
}).then(r => r.json()).then(console.log);

// Expected response: { success: true }
```

**Verification:**
```bash
sqlite3 data/urls.db "SELECT adsShown FROM url_analytics ORDER BY id DESC LIMIT 1;"

# Expected: Incremented by 1
```

---

### Test 5.3: Ad Revenue Estimation

**Steps:**
1. Check ad placement utility functions
2. Verify revenue estimation is calculated

**Manual Test:**
```javascript
// In utils/adPlacement.js testing
const { estimateRevenue } = require('./utils/adPlacement');

const revenue = estimateRevenue({
  impressions: 100,
  clicks: 5,
  difficulty: 'hard'
});

console.log(revenue);
// Expected: ~$1.50-$2.00 (depending on CPM/CPC rates)
```

---

## Test Suite 6: Complete User Flow

### Test 6.1: End-to-End Happy Path

**Steps:**
1. **Homepage** → Enter URL `https://github.com`
2. **Select Difficulty** → Hard
3. **Custom Challenge** → Add custom question: "What is the world's largest code hosting platform?"
4. **Add Hints:**
   ```
   It acquired npm
   Microsoft owns it
   Uses Octocat mascot
   ```
5. **Shorten URL** → Copy shortened link
6. **Open Game** → Navigate to shortened URL
7. **Verify Timer** → 180 seconds countdown
8. **Request Hint** → Click hint button (should see first hint)
9. **Search** → Type "code hosting platform"
10. **Select Result** → Click correct URL (github.com)
11. **Check Score** → Verify score breakdown displayed
12. **View Leaderboard** → Navigate to leaderboard page

**Expected Results:**
- ✅ URL shortened successfully
- ✅ Game loads with correct difficulty
- ✅ Custom question displayed
- ✅ Timer counts down from 180s
- ✅ Hints work correctly (max 5)
- ✅ Search returns results
- ✅ Correct answer awards points
- ✅ Analytics tracked
- ✅ Leaderboard accessible

---

### Test 6.2: Error Handling

**Invalid URL Test:**
```
1. Enter invalid URL: "not a url"
2. Expected: Client-side validation error
```

**CSRF Token Test:**
```javascript
// Open browser console
// Try request without CSRF token
fetch('/shorten', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ urls: ['https://example.com'] })
}).then(r => r.json()).then(console.log);

// Expected: { error: 'Invalid CSRF token' }
```

**Database Error Test:**
```bash
# Make database read-only (Linux/Mac)
chmod 444 data/urls.db

# Try to create URL
# Expected: 500 error with "Database error" message

# Restore permissions
chmod 644 data/urls.db
```

---

## Test Suite 7: Performance & Security

### Test 7.1: Rate Limiting

**Steps:**
1. Open browser console
2. Execute rapid requests:

```javascript
// Attempt to create 50 URLs rapidly
for (let i = 0; i < 50; i++) {
  fetch('/shorten', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
    },
    body: JSON.stringify({
      urls: [`https://example${i}.com`],
      uniqueId: 'test-unique-id'
    })
  }).then(r => console.log(r.status));
}
```

**Expected Results:**
- First 10-15 requests succeed (200 OK)
- Subsequent requests blocked (429 Too Many Requests)
- Rate limit message: "Too many requests, please try again later"

---

### Test 7.2: XSS Prevention

**Steps:**
1. Try to create URL with malicious script in custom challenge:
   ```
   Custom Question: <script>alert('XSS')</script>
   ```
2. Open shortened URL
3. Verify script is **not** executed
4. Check HTML source shows escaped characters

**Expected Results:**
```html
<!-- Script should be escaped -->
&lt;script&gt;alert('XSS')&lt;/script&gt;
```

---

### Test 7.3: SQL Injection Prevention

**Steps:**
1. Try malicious input in URL field:
   ```
   https://example.com'; DROP TABLE urls; --
   ```
2. Attempt to shorten URL
3. Verify database is not affected

**Verification:**
```bash
# Check database still exists and has tables
sqlite3 data/urls.db ".tables"

# Expected: urls, url_analytics, leaderboard, ad_placements, abuse_reports, ip_bans
```

---

## Test Suite 8: Browser Compatibility

### Test 8.1: Cross-Browser Testing

**Test in each browser:**
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (Mac/iOS)

**Features to verify:**
- Game timer countdown
- Hint button functionality
- Search results display
- End game modal
- Leaderboard page rendering
- AdSense placeholders (if enabled)

---

### Test 8.2: Mobile Responsiveness

**Steps:**
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test viewport sizes:
   - iPhone SE (375x667)
   - iPhone 12 Pro (390x844)
   - iPad (768x1024)
   - Samsung Galaxy S20 (360x800)

**Expected Results:**
- Homepage responsive
- Difficulty selector readable
- Game UI fits screen
- Timer and hints visible
- Search results scrollable
- Leaderboard table responsive

---

## Test Suite 9: Console Logging & Debugging

### Test 9.1: Verify Logging

**Steps:**
1. Open browser console (F12)
2. Load game page
3. Check for logs:

**Expected Console Logs:**
```
[GAME] Initialized with difficulty: medium, time limit: 120s, max hints: 3
[GAME] Game data loaded: {difficulty: "medium", timeLimit: 120, maxHints: 3, adsEnabled: false}
[GAME] Started session 5 for abc123 [Medium]
Game timer initialized successfully
Game hint initialized successfully
```

---

### Test 9.2: Error Logging

**Steps:**
1. Open network tab (F12 → Network)
2. Perform game actions
3. Check for errors

**Expected:**
- No 404 errors
- No 500 errors (unless testing error handling)
- All asset files load (CSS, JS, images)

---

## Test Suite 10: Database Integrity

### Test 10.1: Foreign Key Constraints

**Verification:**
```bash
sqlite3 data/urls.db

# Check foreign key enforcement
PRAGMA foreign_keys;
# Expected: 1 (enabled)

# Verify relationships
SELECT COUNT(*) FROM url_analytics WHERE shortCode NOT IN (SELECT shortCode FROM urls);
# Expected: 0 (all analytics reference valid URLs)

.quit
```

---

### Test 10.2: Data Consistency

**Steps:**
1. Create and complete 10 games
2. Check data consistency:

```bash
sqlite3 data/urls.db

-- Verify view counts match analytics sessions
SELECT
  u.shortCode,
  u.totalViews,
  COUNT(a.id) as analyticsCount
FROM urls u
LEFT JOIN url_analytics a ON u.shortCode = a.shortCode
GROUP BY u.shortCode;

-- Expected: totalViews should match analyticsCount

.quit
```

---

## Test Suite 11: Production Readiness

### Test 11.1: Environment Variables

**Checklist:**
```bash
# Verify all required variables are set
✅ SESSION_SECRET (random, secure)
✅ NODE_ENV=production
✅ PORT (default 3000)
✅ ADSENSE_ENABLED (true/false)
✅ ADSENSE_CLIENT_ID (if ads enabled)
✅ DATABASE_PATH (optional, defaults to ./data/urls.db)
```

---

### Test 11.2: Security Headers

**Steps:**
1. Use curl to check headers:

```bash
curl -I http://localhost:3000

# Expected headers:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Strict-Transport-Security: max-age=31536000 (in production with HTTPS)
```

---

### Test 11.3: Database Backup

**Steps:**
```bash
# Create backup
sqlite3 data/urls.db ".backup data/urls_backup.db"

# Verify backup
sqlite3 data/urls_backup.db ".tables"

# Expected: All tables present
```

---

## Test Results Template

Use this template to document your test results:

```markdown
## Test Results - [Date]

### Environment
- Node Version:
- OS:
- Browser:

### Test Suite 1: Difficulty System
- [ ] Test 1.1: Create URLs ✅ PASS / ❌ FAIL
- [ ] Test 1.2: Custom Challenge ✅ PASS / ❌ FAIL

### Test Suite 2: Game Mechanics
- [ ] Test 2.1: Simple Difficulty ✅ PASS / ❌ FAIL
- [ ] Test 2.2: Expert Difficulty ✅ PASS / ❌ FAIL
- [ ] Test 2.3: Timeout ✅ PASS / ❌ FAIL

### Test Suite 3: Analytics
- [ ] Test 3.1: Session Tracking ✅ PASS / ❌ FAIL
- [ ] Test 3.2: Summary ✅ PASS / ❌ FAIL

### Test Suite 4: Leaderboard
- [ ] Test 4.1: Entry ✅ PASS / ❌ FAIL
- [ ] Test 4.2: Page Display ✅ PASS / ❌ FAIL
- [ ] Test 4.3: Empty State ✅ PASS / ❌ FAIL

### Test Suite 5: Ad Placement
- [ ] Test 5.1: Strategy ✅ PASS / ❌ FAIL
- [ ] Test 5.2: Tracking ✅ PASS / ❌ FAIL

### Test Suite 6: User Flow
- [ ] Test 6.1: Happy Path ✅ PASS / ❌ FAIL
- [ ] Test 6.2: Error Handling ✅ PASS / ❌ FAIL

### Test Suite 7: Security
- [ ] Test 7.1: Rate Limiting ✅ PASS / ❌ FAIL
- [ ] Test 7.2: XSS Prevention ✅ PASS / ❌ FAIL
- [ ] Test 7.3: SQL Injection ✅ PASS / ❌ FAIL

### Test Suite 8: Browser Compat
- [ ] Test 8.1: Cross-Browser ✅ PASS / ❌ FAIL
- [ ] Test 8.2: Mobile ✅ PASS / ❌ FAIL

### Issues Found
1. [Issue description]
2. [Issue description]

### Recommendations
- [Recommendation 1]
- [Recommendation 2]
```

---

## Quick Smoke Test

For rapid verification after changes, run this abbreviated test:

```bash
# 1. Start server
npm start

# 2. Create test URL
curl -X POST http://localhost:3000/shorten \
  -H "Content-Type: application/json" \
  -d '{"urls":["https://example.com"],"uniqueId":"test","difficulty":"medium"}'

# 3. Check database
sqlite3 data/urls.db "SELECT shortCode, difficulty, timeLimitSeconds FROM urls ORDER BY id DESC LIMIT 1;"

# 4. Open game in browser
# Navigate to returned shortCode URL

# 5. Complete game
# Verify timer, hints, search, completion

# 6. Check analytics
sqlite3 data/urls.db "SELECT outcome, score FROM url_analytics ORDER BY id DESC LIMIT 1;"
```

---

## Troubleshooting

### Common Issues

**Issue: Database locked**
```bash
# Solution: Close all database connections
pkill -f sqlite3
# Restart server
npm start
```

**Issue: CSRF token errors**
```bash
# Solution: Clear cookies and refresh page
# Or restart server to regenerate session secret
```

**Issue: Timer not counting down**
```javascript
// Check console for errors
// Verify gameStateData element exists
document.getElementById('gameStateData')
// Should return the data div element
```

**Issue: Ads not showing**
```bash
# Check .env file
cat .env | grep ADSENSE

# Verify ADSENSE_ENABLED=true
# Verify ADSENSE_CLIENT_ID is set
```

---

## Next Steps

After completing all tests:

1. ✅ Document all test results
2. ✅ Fix any critical issues found
3. ✅ Re-test fixed issues
4. ✅ Proceed to deployment preparation
5. ✅ Set up production environment
6. ✅ Configure Google AdSense
7. ✅ Deploy to production server
8. ✅ Monitor analytics and performance

---

**Testing Status:** ⏳ Pending Initial Test Run

**Last Updated:** 2025-12-11

**Tested By:** [Your Name]

---

*For deployment instructions, see `DEPLOYMENT_CHECKLIST.md`*
