# 🚀 Dev Servers Status - JFGI with Mental Features

**Date**: 2025-12-11
**Status**: ✅ ALL SERVERS RUNNING

---

## ✅ Backend Server (Python FastAPI)

**URL**: http://localhost:8002
**Status**: ✅ RUNNING
**Process ID**: Background Task (baca9cc)
**Auto-reload**: ✅ Enabled

⚠️ **Note**: Moved from port 8001 to 8002 due to zombie process conflicts

### Health Check
```bash
curl http://localhost:8002/health
```
**Response**:
```json
{"status":"healthy","version":"2.0.0"}
```

### Features Loaded
- ✅ Roasting System (`app.utils.roasting_system`)
- ✅ Profanity Filter (`app.utils.profanity_filter`)
- ✅ Advanced Difficulty System (`app.utils.difficulty`)
- ✅ My URLs Endpoint (`GET /api/v1/urls/my-urls`)
- ✅ Game Endpoints with Roasts
- ✅ Database (SQLite): `backend/jfgi_dev.db`

### API Endpoints Available
- `GET /health` - Health check
- `POST /api/v1/urls/` - Create shortened URL
- `GET /api/v1/urls/my-urls` - Get user's URLs
- `GET /api/v1/game/{shortCode}/initialize` - Initialize game (with roast!)
- `POST /api/v1/game/{shortCode}/hint` - Get hint (with roast + time penalty!)
- `POST /api/v1/game/{shortCode}/search` - Search for answer
- `POST /api/v1/game/{shortCode}/check-answer` - Check answer (with roast!)
- `POST /api/v1/game/{shortCode}/end` - End game
- `GET /api/v1/game/{shortCode}/leaderboard` - Get leaderboard

---

## ✅ Frontend Server (React + Vite)

**URL**: http://localhost:5173
**Status**: ✅ RUNNING
**Process ID**: 41244
**Build Time**: 243ms

### Features Enabled
- ✅ Toast Notification System
- ✅ Hint Time Penalties (visual deduction)
- ✅ Search Operators Display (Simple/Medium modes)
- ✅ Auto-Fill Search (Simple mode)
- ✅ Roast Message Integration
- ✅ Hint Roast Display
- ✅ WebSocket Live Leaderboard

### Pages Available
- `/` - Homepage (create URL)
- `/my-urls` - My URLs page
- `/how-it-works` - Game explanation
- `/game/:shortCode` - Play game
- `/leaderboard/:shortCode` - View leaderboard
- `/play` - Solo play
- `/dashboard` - Dashboard

---

## 🧪 Quick Testing Guide

### Test 1: Create a Simple Mode URL
1. Open http://localhost:5173
2. Paste a URL (e.g., https://github.com)
3. Select **Simple** difficulty (😊)
4. Add challenge text (optional)
5. Click "Create Short URL"
6. Copy the generated link

### Test 2: Play the Game (Simple Mode)
1. Open the generated link
2. **Expected**: Pre-game roast appears (e.g., "Simple mode? Playing it safe, huh?")
3. Click "Start Game"
4. **Expected**: Search box auto-fills with keywords ✅
5. **Expected**: Green search operators box appears below ✅
6. Click "Get Hint"
7. **Expected**:
   - Hint appears
   - Orange roast message below hint
   - Toast: "Giving up already? Here's a hint..."
   - Toast: "⏰ -10s penalty for using hint!"
   - Timer drops by 10 seconds ✅
8. Submit wrong answer
9. **Expected**: Toast roast (e.g., "Wrong! Read the question again, genius.") ❌
10. Submit correct answer
11. **Expected**: Success toast with roast ✅

### Test 3: Play Expert Mode (BRUTAL!)
1. Create URL with **Expert** difficulty (💀)
2. Open generated link
3. **Expected**: "Expert mode? Bold choice for someone with your skills."
4. Start game
5. **Expected**: Search box empty (no auto-fill) ❌
6. **Expected**: NO search operators shown ❌
7. Get Hint #1
8. **Expected**:
   - Cryptic hint (e.g., "The answer lies within 2 parts...")
   - Timer drops by 30 seconds! ✅
   - Toast: Hint roast
9. Get Hint #3
10. **Expected**: Toast: "Stop asking for hints and USE YOUR BRAIN"
11. Let timer run out
12. **Expected**: "Speed: 0/10. Accuracy: N/A. Existence: questionable." 💀

### Test 4: My URLs Page
1. Create 2-3 URLs
2. Navigate to http://localhost:5173/my-urls
3. **Expected**: See all your created URLs with stats
4. Click "Copy Link" button
5. **Expected**: URL copied to clipboard
6. Click "View Leaderboard"
7. **Expected**: Navigate to leaderboard page

---

## 🔍 Debugging Commands

### Check Backend Logs
```bash
# View running backend process
netstat -ano | findstr :8002

# Test roasting system
cd backend
python -c "from app.utils.roasting_system import get_random_roast; print(get_random_roast('expert_difficulty'))"

# Test profanity filter
python -c "from app.utils.profanity_filter import clean_text; print(clean_text('This is a damn test'))"
```

### Check Frontend Logs
```bash
# View running frontend process
netstat -ano | findstr :5173

# Check for console errors
# Open browser DevTools (F12) → Console tab
```

### Backend API Testing
```bash
# Health check
curl http://localhost:8002/health

# Get my URLs (will return URLs created from this IP)
curl http://localhost:8002/api/v1/urls/my-urls

# Create a test URL
curl -X POST http://localhost:8002/api/v1/urls/ \
  -H "Content-Type: application/json" \
  -d '{
    "long_url": "https://github.com",
    "difficulty": "expert",
    "challenge_text": "Find the code repository",
    "hints": ["Look for source code", "Think developers"],
    "time_limit_seconds": 300
  }'
```

---

## 🛑 Stop Servers

### Stop Frontend
```bash
# Find PID
netstat -ano | findstr :5173

# Kill process (replace PID)
taskkill /PID 41244 /F
```

### Stop Backend
```bash
# Find PID
netstat -ano | findstr :8002

# Kill process using Python script
python kill_port_8002.py
```

---

## 🔄 Restart Servers

### Restart Backend (with auto-reload)
```bash
cd backend
uvicorn app.main:app --reload --port 8002
```

### Restart Frontend
```bash
cd frontend
npm run dev
```

---

## 📊 Server Performance

### Backend
- **Startup Time**: ~1-2 seconds
- **Memory Usage**: ~50MB
- **Auto-reload**: Enabled (watches for file changes)
- **Database**: SQLite (jfgi_dev.db)

### Frontend
- **Startup Time**: 243ms
- **Build Tool**: Vite 7.2.7
- **Hot Module Replacement**: Enabled
- **Bundle Size**: ~500KB (development)

---

## ✅ All Systems Go!

**Backend**: ✅ Running on http://localhost:8002
**Frontend**: ✅ Running on http://localhost:5173
**Database**: ✅ Connected (SQLite)
**WebSocket**: ✅ Available for leaderboard updates
**Roasting System**: ✅ Active (70+ roasts loaded)
**Profanity Filter**: ✅ Active
**Difficulty System**: ✅ 4-tier system loaded

---

**Ready to test the MENTAL features! 🔥**

Open http://localhost:5173 and start creating URLs to test the roasting system!
