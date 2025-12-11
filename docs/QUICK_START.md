# JFGI Quick Start Guide
## Get Running in 5 Minutes!

**Status:** 🚀 Ready to Launch!

---

## 🏃 SUPER FAST SETUP (Copy & Paste!)

### Step 1: Install Dependencies (2 minutes)
```bash
cd "C:\Gitlab Projects\nodejs_app"
npm install
```

### Step 2: Create Environment File (1 minute)
```bash
# Copy the template
copy .env.example .env

# Generate secrets (run this command TWICE and save the outputs)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Edit `.env` file and add the secrets:**
```env
SESSION_SECRET=<paste-first-secret-here>
COOKIE_SECRET=<paste-second-secret-here>
```

### Step 3: Create Directories (10 seconds)
```bash
mkdir logs data
```

### Step 4: Start Server! (10 seconds)
```bash
npm run dev
```

### Step 5: Open Browser
```
http://localhost:3000
```

**You should see the JFGI homepage with a chalkboard! 🎉**

---

## 🧪 QUICK TEST CHECKLIST

### Test 1: Homepage Loads ✅
- [ ] Chalkboard canvas visible
- [ ] "Just Google It" message displays
- [ ] Search bar functional
- [ ] URL shortener form visible

### Test 2: Create Short URL ✅
1. Paste a URL (e.g., `https://google.com`) into shortener
2. Click shorten button
3. Short URL should appear (e.g., `http://localhost:3000/shorturl/abc123`)

### Test 3: Game Mechanics ✅
1. Click the short URL
2. Game page loads with challenge
3. Timer starts counting down
4. Search functionality works
5. Hints button appears

### Test 4: Database Tables Created ✅
Check that `data/urls.db` file exists and contains tables:
```bash
# Install sqlite3 tool (if not installed)
# npm install -g sqlite3

# Check tables
sqlite3 data/urls.db ".tables"
```

**Expected output:**
```
abuse_reports    ip_bans          url_analytics
ad_placements    leaderboard      urls
```

---

## 🎮 TESTING NEW FEATURES (After Integration)

### Test Difficulty System
1. Create URL with difficulty selector
2. Choose "Hard" difficulty
3. Click short URL
4. Verify timer is 180 seconds
5. Verify 5 hints available

### Test Analytics
1. Complete a challenge
2. Check `url_analytics` table for session
3. Verify completion tracked

### Test Leaderboard
1. Complete challenge with good time
2. Submit to leaderboard
3. View leaderboard page

---

## 🚨 TROUBLESHOOTING

### Error: "Cannot find module 'express'"
**Fix:** Run `npm install`

### Error: "SESSION_SECRET is required"
**Fix:** Edit `.env` and add SESSION_SECRET

### Error: "Address already in use (port 3000)"
**Fix:** Change PORT in `.env` or kill existing process:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or just change port in .env
PORT=3001
```

### Error: "Database locked"
**Fix:** Stop server (Ctrl+C), delete `data/urls.db`, restart

### Chalkboard not showing
**Fix:** Clear browser cache (Ctrl+Shift+R)

### Sessions not working
**Fix:** Ensure COOKIE_SECRET is set in `.env`

---

## 📊 DATABASE INSPECTION

### View all tables:
```bash
sqlite3 data/urls.db ".tables"
```

### View urls table:
```bash
sqlite3 data/urls.db "SELECT * FROM urls;"
```

### View analytics:
```bash
sqlite3 data/urls.db "SELECT * FROM url_analytics;"
```

### View leaderboard:
```bash
sqlite3 data/urls.db "SELECT * FROM leaderboard ORDER BY score DESC LIMIT 10;"
```

### Check table schema:
```bash
sqlite3 data/urls.db ".schema urls"
```

---

## 🔧 DEVELOPMENT TIPS

### Watch for file changes:
```bash
npm run dev
# Nodemon auto-restarts on file changes
```

### View logs:
```bash
# Error log
cat logs/error.log

# Combined log
cat logs/combined.log

# Windows
type logs\error.log
type logs\combined.log
```

### Test API endpoints:
```bash
# Create short URL
curl -X POST http://localhost:3000/shorten \
  -H "Content-Type: application/json" \
  -d "{\"urls\": [\"https://google.com\"]}"

# Get URL info
curl http://localhost:3000/shorten/expand/abc123
```

---

## 🎯 WHAT TO TEST FIRST

### 1. Basic Flow (5 minutes)
1. ✅ Start server
2. ✅ Open homepage
3. ✅ Create short URL
4. ✅ Click short URL
5. ✅ Play game
6. ✅ Complete challenge
7. ✅ Verify redirect

### 2. New Features (5 minutes) - After Integration
1. ✅ Select difficulty (Simple, Medium, Hard, Expert)
2. ✅ Verify timer adjusts
3. ✅ Use hints
4. ✅ Complete challenge
5. ✅ Check leaderboard
6. ✅ View analytics (if admin dashboard exists)

---

## 📈 WHAT'S NEXT

After testing works:
1. 🔨 Integrate new features (I'm doing this now!)
2. 🗄️ Migrate to PostgreSQL (production-ready)
3. 💰 Add Google AdSense (start earning!)
4. 🚀 Deploy to production (DigitalOcean + Cloudflare)

---

## 🆘 NEED HELP?

**Common Issues:**
- Database errors → Delete `data/urls.db` and restart
- Port conflicts → Change PORT in `.env`
- Module errors → Run `npm install`
- CSRF errors → Check COOKIE_SECRET in `.env`

**Still stuck?** Check:
- `logs/error.log` for errors
- Browser console (F12) for frontend errors
- Terminal output for backend errors

---

**Let's get this running! 🚀**

**Current Status:** Testing existing features while I integrate new ones...
