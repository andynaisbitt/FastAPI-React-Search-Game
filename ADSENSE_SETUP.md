# Google AdSense Setup Guide

## 📋 Current Status: ads.txt Not Found

**Issue**: Google AdSense can't show ads because your ads.txt file wasn't found.

**Solution**: Follow the steps below to fix this.

---

## ✅ Step 1: Get Your Publisher ID

1. Go to https://www.google.com/adsense/
2. Sign in to your AdSense account
3. Your publisher ID will be in the format: `ca-pub-1234567890123456`
4. Copy this ID (you'll need it in the next steps)

---

## ✅ Step 2: Update ads.txt File

The file has been created at: `frontend/public/ads.txt`

**Edit this file and replace:**
```
google.com, ca-pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
```

**With your actual publisher ID:**
```
google.com, ca-pub-1234567890123456, DIRECT, f08c47fec0942fa0
```

---

## ✅ Step 3: Update Environment Variables

Edit your `.env` file (or create one from `.env.example`):

```bash
# In .env.example or .env
ADSENSE_CLIENT_ID=ca-pub-1234567890123456
ADSENSE_ENABLED=true
```

---

## ✅ Step 4: Deploy ads.txt to Your Live Site

The ads.txt file **MUST** be accessible at the root of your domain.

### Option A: Static Hosting (Recommended for Frontend)

If you're using Vercel, Netlify, or similar:

1. The file is already in `frontend/public/ads.txt`
2. When you deploy, Vite will automatically serve it at `/ads.txt`
3. Test: `https://yourdomain.com/ads.txt`

### Option B: Backend Serving

If serving from Python backend, add a route:

```python
# backend/app/main.py

from fastapi.responses import PlainTextResponse

@app.get("/ads.txt")
async def ads_txt():
    return PlainTextResponse(
        "google.com, ca-pub-1234567890123456, DIRECT, f08c47fec0942fa0"
    )
```

### Option C: Both Frontend + Backend

Serve from both locations for redundancy:
- Frontend: `https://yourdomain.com/ads.txt` (Vite static files)
- Backend: `https://api.yourdomain.com/ads.txt` (FastAPI route)

---

## ✅ Step 5: Verify Deployment

### Test Your ads.txt File

Visit your live site:
```
https://yourdomain.com/ads.txt
```

**You should see:**
```
google.com, ca-pub-1234567890123456, DIRECT, f08c47fec0942fa0
```

### Validate with Google

1. Go to https://adstxt.guru/validator/
2. Enter your domain
3. Check if your publisher ID is detected

---

## ✅ Step 6: Update AdSense

1. Go to your AdSense account
2. Navigate to **Sites** or **Account Settings**
3. Wait 24-48 hours for Google to re-crawl your site
4. The status should change from "Not found" to "Authorized"

---

## 🚀 Quick Deploy Commands

If you need to push the ads.txt update to GitHub:

```bash
cd "C:\Gitlab Projects\nodejs_app"

git add frontend/public/ads.txt
git commit -m "feat: add ads.txt for Google AdSense authorization"
git push origin main
```

Then deploy your frontend to your hosting service.

---

## 📊 AdSense Integration in Your App

### Current Setup

Your app has ad placeholders configured in:
- `legacy/utils/adPlacement.js` - Ad placement logic (legacy)
- `.env.example` - AdSense configuration template

### Where Ads Appear

Based on your legacy code, ads can be shown:
1. **Pre-Game** - Before starting the challenge
2. **Mid-Game** - During gameplay (optional)
3. **Post-Game** - After completing the challenge

### Enable Ads

To activate ads in your modern React app:

1. Install AdSense script in `frontend/index.html`:
```html
<head>
  <!-- Google AdSense -->
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456"
     crossorigin="anonymous"></script>
</head>
```

2. Create ad components in React:
```typescript
// frontend/src/components/AdBanner.tsx
export const AdBanner = () => {
  return (
    <ins className="adsbygoogle"
         style={{ display: 'block' }}
         data-ad-client="ca-pub-1234567890123456"
         data-ad-slot="1234567890"
         data-ad-format="auto"
         data-full-width-responsive="true"></ins>
  );
};
```

---

## 🔍 Troubleshooting

### "Not found" - ads.txt not accessible

**Problem**: Google can't find your ads.txt file

**Solutions**:
- Verify the file is at the root: `https://yourdomain.com/ads.txt`
- Check your hosting configuration (Vite should serve `public/` as root)
- Ensure no redirect removes the file (check your nginx/hosting config)
- Wait 24 hours for Google to re-crawl

### "Unauthorized" - Publisher ID not found

**Problem**: Your publisher ID isn't in the ads.txt file

**Solutions**:
- Double-check you replaced the X's with your actual publisher ID
- Verify the format: `google.com, ca-pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`
- Ensure no typos in your publisher ID
- Re-deploy and wait for Google to re-crawl

### "Not applicable" - Publisher ID not needed

**Problem**: You're using a different ad network or method

**Solution**: This is fine! Some AdSense setups don't require ads.txt

---

## 📝 Example Complete ads.txt

For multiple ad networks (if needed):

```txt
# Google AdSense
google.com, ca-pub-1234567890123456, DIRECT, f08c47fec0942fa0

# Optional: Other ad networks
# adnetwork.com, publisherid, DIRECT/RESELLER, certauthorityid
```

---

## ✅ Checklist

Before deploying:
- [ ] Replace `ca-pub-XXXXXXXXXXXXXXXX` with actual ID
- [ ] File is in `frontend/public/ads.txt`
- [ ] File is accessible at `https://yourdomain.com/ads.txt`
- [ ] Updated `.env` with your publisher ID
- [ ] Waited 24-48 hours for Google to verify
- [ ] Checked AdSense dashboard for "Authorized" status

---

**After Setup**: Your ads.txt file will authorize Google to show ads on your site, allowing you to monetize your JFGI game! 💰
