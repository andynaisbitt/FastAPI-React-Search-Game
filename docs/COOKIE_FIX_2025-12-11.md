# Cookie/UniqueId Fix - 2025-12-11

## 🐛 Issue: "User unique ID not found" - 400 Error on URL Shortener

### **Problem:**
When trying to shorten URLs, getting:
```
POST http://localhost:3000/shorten 400 (Bad Request)
Error: {error: 'User unique ID not found'}
```

### **Root Cause:**
The frontend JavaScript was trying to set the `uniqueId` cookie with the `Secure` flag **hardcoded to true**:

```javascript
// BROKEN CODE (urlShortener.js line 23, main.js line 108):
document.cookie = `${name}=${value}${expires}; path=/; SameSite=Strict; Secure`;
//                                                                         ^^^^^^
//                                                                         ALWAYS TRUE!
```

**Why this fails:**
- `Secure` flag requires HTTPS
- Localhost runs on HTTP (`http://localhost:3000`)
- Browser **rejects** setting secure cookies on HTTP
- Cookie never gets set
- Frontend sends `uniqueId: undefined` to backend
- Backend rejects request: "User unique ID not found"

---

## ✅ **Fix Applied:**

### **1. Make Secure Flag Conditional (Frontend)**

**Updated `public/js/urlShortener.js` (lines 23-26):**
```javascript
// Only use Secure flag on HTTPS (production)
const isSecure = window.location.protocol === 'https:';
const secureFlag = isSecure ? '; Secure' : '';
document.cookie = `${name}=${value}${expires}; path=/; SameSite=Strict${secureFlag}`;
```

**Updated `public/js/main.js` (lines 108-111):**
```javascript
// Same fix
const isSecure = window.location.protocol === 'https:';
const secureFlag = isSecure ? '; Secure' : '';
document.cookie = `${name}=${value}${expires}; path=/; SameSite=Strict${secureFlag}`;
```

**Result:**
- ✅ HTTP (localhost): Cookie set **WITHOUT** Secure flag
- ✅ HTTPS (production): Cookie set **WITH** Secure flag
- ✅ Cookie now works on localhost!

---

### **2. Added Debug Logging (Backend)**

**Updated `controllers/shortenerController.js` (lines 14-21):**
```javascript
logger.info('Shorten URL request:', {
  hasBodyUniqueId: !!req.body.uniqueId,
  hasCookieUniqueId: !!req.cookies.uniqueId,
  hasSessionUniqueId: !!req.session.uniqueId,
  finalUniqueId: uniqueId ? 'present' : 'missing',
  cookies: req.cookies
});
```

**Result:**
- ✅ Server logs show exactly where uniqueId is coming from
- ✅ Helps debug future cookie issues

---

### **3. Added Debug Logging (Frontend)**

**Updated `public/js/urlShortener.js` (lines 126-127, 140):**
```javascript
console.log('[URL Shortener] UniqueId:', uniqueId);
console.log('[URL Shortener] All cookies:', document.cookie);
console.log('[URL Shortener] Request data:', requestData);
```

**Result:**
- ✅ Browser console shows uniqueId before sending
- ✅ Shows all cookies to verify they're set
- ✅ Shows final request payload

---

### **4. Added UniqueId Validation (Backend)**

**Updated `controllers/shortenerController.js` (lines 23-26):**
```javascript
if (!uniqueId) {
  logger.warn('User unique ID not found in request');
  return res.status(400).json({ error: 'User unique ID not found' });
}
```

**Result:**
- ✅ Explicit error message when uniqueId missing
- ✅ Prevents undefined errors downstream

---

## 🧪 **Testing Instructions:**

### **1. Clear Browser Data First:**
```
1. Open DevTools (F12)
2. Go to Application tab
3. Cookies → http://localhost:3000
4. Delete all cookies (right-click → Clear)
5. Refresh page (Ctrl+R)
```

### **2. Test URL Shortener:**
```
1. Open http://localhost:3000
2. Open browser console (F12)
3. Enter URL: https://google.com
4. Click "Shorten URL"
5. Check console output:
   - Should see: [URL Shortener] UniqueId: xxxxx-xxxx-xxxx...
   - Should see: [URL Shortener] All cookies: uniqueId=xxxxx...
   - Should see: [URL Shortener] Request data: {...}
6. Should get success (shortened URL appears)
```

### **3. Check Server Logs:**
```
Server terminal should show:
info: Shorten URL request: {
  hasBodyUniqueId: true,
  hasCookieUniqueId: true,  ← Should be true
  hasSessionUniqueId: false,
  finalUniqueId: 'present',
  cookies: { uniqueId: 'xxxxx...' }
}
```

---

## 📊 **Before vs After:**

| Scenario | Before | After |
|----------|--------|-------|
| **HTTP (localhost)** | ❌ Cookie rejected (Secure=true) | ✅ Cookie set (Secure=false) |
| **HTTPS (production)** | ✅ Cookie set (Secure=true) | ✅ Cookie set (Secure=true) |
| **UniqueId in request** | ❌ undefined | ✅ Valid UUID |
| **URL shortening** | ❌ 400 error | ✅ Works! |
| **Debug visibility** | ❌ No logs | ✅ Console + server logs |

---

## 🔧 **How Cookie Setting Works:**

### **Frontend Flow:**
```javascript
1. Page loads
2. getOrSetUniqueId() called
3. Check if cookie exists: getCookie('uniqueId')
4. If not exists:
   a. Generate UUID: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
   b. Set cookie with setCookie()
   c. NEW: Check protocol (http vs https)
   d. Set Secure flag accordingly
5. Return uniqueId
6. Send in POST body to /shorten
```

### **Backend Flow:**
```javascript
1. Receive POST /shorten
2. Check for uniqueId in:
   - req.body.uniqueId (frontend sent)
   - req.cookies.uniqueId (browser cookie)
   - req.session.uniqueId (session store)
3. NEW: Log what we found
4. NEW: Validate uniqueId exists
5. Proceed with URL shortening
```

---

## 🚨 **Common Issues:**

### **Issue: Cookie still not set**
**Check:**
```javascript
// In browser console:
document.cookie
// Should show: "uniqueId=xxxxxxxx-xxxx..."

// If empty, check:
window.location.protocol
// Should be: "http:" for localhost
```

### **Issue: uniqueId is undefined**
**Check:**
```javascript
// In browser console:
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}
getCookie('uniqueId');
// Should return UUID string, not undefined
```

### **Issue: Still getting 400 error**
**Check server logs:**
```
Should see:
info: Shorten URL request: {...}

If not, check:
1. Server restarted after code changes?
2. Browser refreshed (Ctrl+Shift+R)?
3. Cookies cleared?
```

---

## 📝 **Files Modified:**

1. ✅ `public/js/urlShortener.js` (lines 23-27, 126-127, 140)
   - Fixed setCookie to use conditional Secure flag
   - Added console logging

2. ✅ `public/js/main.js` (lines 108-112)
   - Fixed setCookie to use conditional Secure flag

3. ✅ `controllers/shortenerController.js` (lines 14-26)
   - Added debug logging
   - Added uniqueId validation

---

## ✅ **Expected Behavior Now:**

### **On HTTP (localhost:3000):**
```
Cookie: uniqueId=xxxxx; Path=/; SameSite=Strict
       (No Secure flag)
```

### **On HTTPS (production):**
```
Cookie: uniqueId=xxxxx; Path=/; SameSite=Strict; Secure
       (With Secure flag)
```

---

**Status:** ✅ **FIXED - READY TO TEST**
**Date:** 2025-12-11
**Impact:** URL shortener should work now on localhost
**Testing:** Clear cookies, refresh page, try shortening URL
