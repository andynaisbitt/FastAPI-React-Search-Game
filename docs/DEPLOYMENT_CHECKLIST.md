# JFGI Deployment Checklist

## Overview
Complete deployment guide for launching JFGI (JustFuckingGoogleIt) to production with all new features: difficulty levels, analytics, leaderboards, and AdSense integration.

---

## Pre-Deployment Checklist

### ✅ Code Review & Testing

- [ ] All features tested locally (see `TESTING_GUIDE.md`)
- [ ] No console errors in browser
- [ ] No server errors in logs
- [ ] Database schema verified
- [ ] All dependencies updated to stable versions
- [ ] Security vulnerabilities checked (`npm audit`)
- [ ] Code linted and formatted
- [ ] Git repository clean (no uncommitted changes)

---

### ✅ Environment Configuration

**Required Environment Variables:**

```bash
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Security (CRITICAL)
SESSION_SECRET=[GENERATE RANDOM 32+ CHARACTER STRING]
# Generate using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Database
DATABASE_PATH=./data/urls.db

# AdSense (Optional)
ADSENSE_ENABLED=true
ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

**Security Notes:**
- ⚠️ **NEVER** commit `.env` file to git
- ⚠️ **NEVER** use default `SESSION_SECRET` in production
- ⚠️ Generate unique session secret for production
- ⚠️ Store secrets in secure environment (e.g., AWS Secrets Manager)

---

### ✅ Database Preparation

**Pre-deployment:**

```bash
# 1. Backup development database (optional)
sqlite3 data/urls.db ".backup data/urls_dev_backup.db"

# 2. Create fresh production database OR
# Copy development data (testing only)
cp data/urls.db data/urls_production.db

# 3. Verify database schema
sqlite3 data/urls.db ".schema" > schema_verification.sql

# 4. Check database integrity
sqlite3 data/urls.db "PRAGMA integrity_check;"
# Expected: ok
```

**Production Database Setup:**

```bash
# Option 1: SQLite (Current Implementation)
mkdir -p /var/www/jfgi/data
chmod 755 /var/www/jfgi/data
# Database will auto-create on first run

# Option 2: PostgreSQL (Future Migration)
# See POSTGRESQL_MIGRATION.md for instructions
```

---

### ✅ Server Requirements

**Minimum Specifications:**
- **OS:** Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **RAM:** 512MB (1GB recommended)
- **Storage:** 2GB (10GB recommended for logs/analytics)
- **Node.js:** v18+ (LTS recommended)
- **CPU:** 1 vCPU (2 vCPU recommended)

**Recommended Hosting Providers:**
- DigitalOcean ($6/month Droplet)
- AWS Lightsail ($5/month)
- Linode ($5/month Nanode)
- Vultr ($6/month)
- Heroku (Free tier, limited)

---

## Server Setup

### Step 1: Initial Server Configuration

```bash
# 1. Update system packages
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Verify installation
node --version  # Should be v18.x.x
npm --version   # Should be 9.x.x

# 4. Install build essentials (for SQLite native bindings)
sudo apt install -y build-essential python3

# 5. Install PM2 (process manager)
sudo npm install -g pm2

# 6. Install Nginx (reverse proxy)
sudo apt install -y nginx

# 7. Install Certbot (SSL certificates)
sudo apt install -y certbot python3-certbot-nginx

# 8. Create application user
sudo useradd -m -s /bin/bash jfgi
sudo usermod -aG sudo jfgi  # Optional: grant sudo access

# 9. Create application directory
sudo mkdir -p /var/www/jfgi
sudo chown -R jfgi:jfgi /var/www/jfgi
```

---

### Step 2: Application Deployment

```bash
# 1. Switch to application user
sudo su - jfgi

# 2. Clone repository OR upload files
cd /var/www/jfgi
git clone https://github.com/YOUR_USERNAME/JFGI.git .
# OR use rsync/scp to copy files

# 3. Install dependencies (production only)
npm ci --production

# 4. Create necessary directories
mkdir -p data logs public/uploads

# 5. Set permissions
chmod 755 data
chmod 755 logs
chmod 755 public/uploads

# 6. Create .env file
nano .env
# Paste production environment variables (see above)
# Save and exit (Ctrl+X, Y, Enter)

# 7. Verify .env file
cat .env | grep SESSION_SECRET
# Should show unique random string

# 8. Test application
NODE_ENV=production node app.js
# Should start without errors
# Press Ctrl+C to stop

# 9. Exit application user
exit
```

---

### Step 3: PM2 Configuration

```bash
# 1. Switch to application user
sudo su - jfgi
cd /var/www/jfgi

# 2. Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'jfgi',
    script: './app.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '500M',
    watch: false
  }]
};
EOF

# 3. Start application with PM2
pm2 start ecosystem.config.js

# 4. Verify application is running
pm2 status
# Should show "jfgi" as "online"

# 5. View logs
pm2 logs jfgi --lines 50

# 6. Save PM2 configuration
pm2 save

# 7. Setup PM2 startup script
pm2 startup systemd
# Copy and run the generated command (as root)

# 8. Exit application user
exit

# 9. Run the PM2 startup command (as shown by previous step)
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u jfgi --hp /home/jfgi
```

---

### Step 4: Nginx Reverse Proxy

```bash
# 1. Create Nginx configuration
sudo nano /etc/nginx/sites-available/jfgi

# Paste the following configuration:
```

```nginx
# /etc/nginx/sites-available/jfgi

upstream jfgi_backend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;  # PM2 cluster instance
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name jfgi.com www.jfgi.com;  # Replace with your domain

    # Redirect HTTP to HTTPS (after SSL is configured)
    # return 301 https://$server_name$request_uri;

    # Logging
    access_log /var/log/nginx/jfgi_access.log;
    error_log /var/log/nginx/jfgi_error.log;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Static files
    location /css/ {
        alias /var/www/jfgi/public/css/;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    location /js/ {
        alias /var/www/jfgi/public/js/;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    location /img/ {
        alias /var/www/jfgi/public/img/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Proxy to Node.js application
    location / {
        proxy_pass http://jfgi_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }

    location ~ /data/ {
        deny all;
    }

    location ~ /\.env {
        deny all;
    }
}
```

```bash
# 2. Enable site configuration
sudo ln -s /etc/nginx/sites-available/jfgi /etc/nginx/sites-enabled/

# 3. Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# 4. Test Nginx configuration
sudo nginx -t
# Expected: syntax is ok, test is successful

# 5. Reload Nginx
sudo systemctl reload nginx

# 6. Enable Nginx autostart
sudo systemctl enable nginx
```

---

### Step 5: SSL Certificate (HTTPS)

```bash
# 1. Obtain Let's Encrypt SSL certificate
sudo certbot --nginx -d jfgi.com -d www.jfgi.com

# Follow prompts:
# - Enter email address
# - Agree to Terms of Service
# - Choose redirect HTTP to HTTPS (option 2)

# 2. Verify certificate
sudo certbot certificates

# 3. Test SSL configuration
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=jfgi.com

# 4. Setup auto-renewal
sudo certbot renew --dry-run
# Expected: Congratulations, all renewals succeeded

# 5. Add cron job for auto-renewal (certbot should do this automatically)
sudo crontab -e
# Add line:
0 3 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

---

### Step 6: Firewall Configuration

```bash
# 1. Install UFW (if not installed)
sudo apt install -y ufw

# 2. Allow SSH (IMPORTANT - do this first!)
sudo ufw allow 22/tcp

# 3. Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 4. Enable firewall
sudo ufw enable

# 5. Verify rules
sudo ufw status
# Should show: 22, 80, 443 ALLOW
```

---

## Google AdSense Setup

### Step 1: Create AdSense Account

1. Navigate to: https://www.google.com/adsense/
2. Sign in with Google account
3. Click "Get Started"
4. Enter your website URL: `https://jfgi.com`
5. Select country and accept terms
6. Submit application

**Approval Timeline:** 1-2 weeks

---

### Step 2: Add AdSense Code

**After approval:**

1. Log in to AdSense dashboard
2. Navigate to "Ads" → "Overview"
3. Copy your AdSense Client ID (e.g., `ca-pub-1234567890123456`)
4. Update `.env` file:

```bash
sudo su - jfgi
cd /var/www/jfgi
nano .env

# Update:
ADSENSE_ENABLED=true
ADSENSE_CLIENT_ID=ca-pub-YOUR_ID_HERE

# Save and restart PM2
pm2 restart jfgi
```

---

### Step 3: Create Ad Units

**In AdSense Dashboard:**

1. **Banner Ad (728x90):**
   - Go to "Ads" → "By ad unit"
   - Click "Create new ad unit"
   - Name: "JFGI Banner Before"
   - Type: Display ads
   - Size: 728x90 (Leaderboard)
   - Copy ad code

2. **Sidebar Ad (160x600):**
   - Name: "JFGI Sidebar During"
   - Size: 160x600 (Wide Skyscraper)

3. **Interstitial Ad (336x280):**
   - Name: "JFGI Interstitial After"
   - Size: 336x280 (Medium Rectangle)

**Replace placeholders in `views/game.ejs`:**

```html
<!-- Replace placeholder divs with actual AdSense code -->
<ins class="adsbygoogle"
     style="display:inline-block;width:728px;height:90px"
     data-ad-client="ca-pub-YOUR_ID"
     data-ad-slot="1234567890"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
```

---

## Monitoring & Maintenance

### Step 1: Setup Monitoring

**PM2 Monitoring:**

```bash
# 1. Install PM2 Plus (optional)
pm2 plus

# 2. Monitor application
pm2 monit

# 3. View logs
pm2 logs jfgi --lines 100
```

**Server Monitoring:**

```bash
# 1. Install monitoring tools
sudo apt install -y htop iotop

# 2. Check resource usage
htop

# 3. Monitor disk space
df -h

# 4. Monitor database size
du -sh /var/www/jfgi/data/
```

---

### Step 2: Log Rotation

```bash
# 1. Create logrotate configuration
sudo nano /etc/logrotate.d/jfgi

# Paste:
```

```
/var/www/jfgi/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 jfgi jfgi
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

```bash
# 2. Test logrotate
sudo logrotate -f /etc/logrotate.d/jfgi
```

---

### Step 3: Backup Strategy

**Daily Database Backup:**

```bash
# 1. Create backup script
sudo nano /usr/local/bin/jfgi-backup.sh

# Paste:
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/jfgi"
DATE=$(date +%Y%m%d_%H%M%S)
DB_PATH="/var/www/jfgi/data/urls.db"

mkdir -p $BACKUP_DIR

# Backup database
sqlite3 $DB_PATH ".backup $BACKUP_DIR/urls_$DATE.db"

# Compress
gzip $BACKUP_DIR/urls_$DATE.db

# Delete backups older than 30 days
find $BACKUP_DIR -name "urls_*.db.gz" -mtime +30 -delete

echo "Backup completed: urls_$DATE.db.gz"
```

```bash
# 2. Make executable
sudo chmod +x /usr/local/bin/jfgi-backup.sh

# 3. Add cron job
sudo crontab -e
# Add:
0 2 * * * /usr/local/bin/jfgi-backup.sh >> /var/log/jfgi-backup.log 2>&1

# 4. Test backup
sudo /usr/local/bin/jfgi-backup.sh
```

**Remote Backup (Optional):**

```bash
# Sync to AWS S3 (example)
aws s3 sync /var/backups/jfgi s3://your-bucket/jfgi-backups/
```

---

## SEO Optimization

### Step 1: Domain & DNS Configuration

**Register Domain:**
- ✅ `jfgi.com` (primary)
- ✅ `justfuckinggoogleit.com` (redirect to jfgi.com)
- ✅ `justtrygooglgingit.com` (censored version)

**DNS Records:**

```
Type  | Name | Value              | TTL
------|------|--------------------|-----
A     | @    | YOUR_SERVER_IP     | 3600
A     | www  | YOUR_SERVER_IP     | 3600
AAAA  | @    | YOUR_IPv6_IP       | 3600  (if available)
AAAA  | www  | YOUR_IPv6_IP       | 3600  (if available)
```

---

### Step 2: Google Search Console

1. Navigate to: https://search.google.com/search-console
2. Add property: `https://jfgi.com`
3. Verify ownership (DNS TXT record or HTML file)
4. Submit sitemap: `https://jfgi.com/sitemap.xml`

**Create Sitemap:**

```bash
# Create simple sitemap
sudo nano /var/www/jfgi/public/sitemap.xml
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://jfgi.com/</loc>
    <lastmod>2025-12-11</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://jfgi.com/about</loc>
    <lastmod>2025-12-11</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

---

### Step 3: Meta Tags & Open Graph

**Verify in `views/index.ejs`:**

```html
<head>
  <!-- SEO Meta Tags -->
  <title>JFGI - Just Fucking Google It | URL Shortener Game</title>
  <meta name="description" content="Challenge your friends with JFGI - a fun URL shortening game that makes people Google before revealing the answer. Multiple difficulty levels!">
  <meta name="keywords" content="jfgi, just fucking google it, url shortener, google game, search challenge">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://jfgi.com/">
  <meta property="og:title" content="JFGI - Just Fucking Google It">
  <meta property="og:description" content="Challenge your friends to find the URL by Googling!">
  <meta property="og:image" content="https://jfgi.com/img/og-image.png">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="https://jfgi.com/">
  <meta name="twitter:title" content="JFGI - Just Fucking Google It">
  <meta name="twitter:description" content="Challenge your friends to find the URL by Googling!">
  <meta name="twitter:image" content="https://jfgi.com/img/og-image.png">
</head>
```

---

### Step 4: Analytics

**Google Analytics 4:**

1. Create GA4 property: https://analytics.google.com/
2. Copy Measurement ID (e.g., `G-XXXXXXXXXX`)
3. Add to `views/index.ejs` and `views/game.ejs`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## Post-Deployment Verification

### ✅ Final Checklist

- [ ] Website accessible via HTTPS: `https://jfgi.com`
- [ ] SSL certificate valid (green padlock)
- [ ] Homepage loads correctly
- [ ] Can create shortened URLs
- [ ] Game loads and functions correctly
- [ ] Timer counts down properly
- [ ] Hints work (max per difficulty)
- [ ] Search returns results
- [ ] Correct answer awards points
- [ ] Leaderboard accessible
- [ ] Analytics tracking (check database)
- [ ] AdSense ads display (if enabled)
- [ ] Mobile responsive
- [ ] No console errors
- [ ] PM2 status shows "online"
- [ ] Nginx serving correctly
- [ ] Logs rotating
- [ ] Backups running
- [ ] SSL auto-renewal configured
- [ ] Firewall configured
- [ ] DNS propagated

---

### ✅ Performance Tests

```bash
# 1. Load Testing (optional)
npm install -g artillery
artillery quick --count 10 --num 20 https://jfgi.com

# 2. Lighthouse Audit
# Visit: https://web.dev/measure/
# Or use Chrome DevTools → Lighthouse

# 3. Security Scan
# Visit: https://observatory.mozilla.org/
# Scan: jfgi.com
```

---

### ✅ Monitor First 24 Hours

```bash
# 1. Watch PM2 logs
pm2 logs jfgi --lines 200

# 2. Monitor error logs
tail -f /var/www/jfgi/logs/error.log

# 3. Check Nginx access logs
sudo tail -f /var/log/nginx/jfgi_access.log

# 4. Monitor server resources
htop

# 5. Check database growth
watch -n 60 'du -sh /var/www/jfgi/data/'

# 6. Verify analytics tracking
sqlite3 /var/www/jfgi/data/urls.db "SELECT COUNT(*) FROM url_analytics;"
```

---

## Rollback Procedure

**If deployment fails:**

```bash
# 1. Stop PM2
pm2 stop jfgi

# 2. Restore previous version
cd /var/www/jfgi
git checkout [PREVIOUS_COMMIT_HASH]
# OR restore from backup

# 3. Restore database (if needed)
cp /var/backups/jfgi/urls_LATEST.db /var/www/jfgi/data/urls.db

# 4. Restart PM2
pm2 restart jfgi

# 5. Verify
pm2 status
pm2 logs jfgi --lines 50
```

---

## Update Procedure

**For future updates:**

```bash
# 1. SSH into server
ssh jfgi@your-server-ip

# 2. Switch to app directory
cd /var/www/jfgi

# 3. Backup current version
cp -r /var/www/jfgi /var/www/jfgi_backup_$(date +%Y%m%d)

# 4. Backup database
sqlite3 data/urls.db ".backup data/urls_backup_$(date +%Y%m%d).db"

# 5. Pull latest changes
git pull origin main

# 6. Install new dependencies
npm ci --production

# 7. Restart application
pm2 restart jfgi

# 8. Monitor logs
pm2 logs jfgi --lines 50

# 9. Verify website works
curl -I https://jfgi.com
# Should return 200 OK
```

---

## Troubleshooting

### Common Issues

**Issue: PM2 not starting**
```bash
# Check logs
pm2 logs jfgi --err

# Verify .env file exists
ls -la /var/www/jfgi/.env

# Check Node.js version
node --version  # Should be v18+
```

**Issue: Database locked**
```bash
# Check if database is being accessed
lsof | grep urls.db

# Kill process if needed
pm2 restart jfgi
```

**Issue: Nginx 502 Bad Gateway**
```bash
# Check PM2 status
pm2 status

# Check Nginx error log
sudo tail -f /var/log/nginx/error.log

# Restart services
pm2 restart jfgi
sudo systemctl restart nginx
```

**Issue: High memory usage**
```bash
# Check PM2 status
pm2 status

# Restart if memory > 500MB
pm2 restart jfgi

# Monitor
pm2 monit
```

---

## Support Contacts

- **Server Issues:** [Your Hosting Provider Support]
- **Domain Issues:** [Your Domain Registrar]
- **SSL Issues:** Let's Encrypt Community Forum
- **AdSense Issues:** Google AdSense Support
- **Code Issues:** GitHub Issues

---

## Deployment Timeline

**Estimated Deployment Time:** 2-4 hours

### Timeline Breakdown:
- Server setup: 30-60 min
- Application deployment: 15-30 min
- Nginx configuration: 15-30 min
- SSL setup: 10-15 min
- Testing: 30-60 min
- Monitoring setup: 15-30 min
- DNS propagation: 0-24 hours

---

**Deployment Status:** ⏳ Ready to Deploy

**Deployed By:** [Your Name]

**Deployment Date:** [YYYY-MM-DD]

**Server IP:** [YOUR_IP]

**Domain:** [YOUR_DOMAIN]

---

*For testing procedures, see `TESTING_GUIDE.md`*

*For feature documentation, see `INTEGRATION_COMPLETE.md`*
