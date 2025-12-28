# 🔐 ADMIN SETUP - CONFIDENTIAL

## Your Secure Admin Credentials

**⚠️ SAVE THESE IN A PASSWORD MANAGER IMMEDIATELY**

### Production Admin Access

```
URL: https://pofgold.com/admin
Username: admin@pofgold.com
Password: IylCWetUuJ783/QgKUCYfY3Qz/U=
PIN: 7854
Recovery Email: guampaul@gmail.com
```

### API Keys (For Vercel Environment Variables)

```bash
ADMIN_JWT_SECRET=59d0a85c8b964b34c06edc9af4325745113c711221a2430c9c776dd2258dab38
ADMIN_API_KEY=d017de46589c6c48338d5dc2c4c99ef3
ADMIN_SECRET_KEY=1b32a370e5f4011f542aea26622ba9d1
```

## Complete Vercel Environment Variables

Copy and paste these into Vercel Dashboard → Settings → Environment Variables:

```bash
# ============================================
# ESSENTIAL - MUST ADD FIRST
# ============================================
APP_URL=https://pofgold.com
DOMAIN_NAME=pofgold.com

# ============================================
# FIREBASE (YOUR EXISTING CONFIG)
# ============================================
FIREBASE_API_KEY=AIzaSyBJSp7vX2-SOWCpjbgTEAPj_T9QQL72JX4
FIREBASE_AUTH_DOMAIN=potofgold-production.firebaseapp.com
FIREBASE_PROJECT_ID=potofgold-production
FIREBASE_STORAGE_BUCKET=potofgold-production.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=511446280789
FIREBASE_APP_ID=1:511446280789:web:f52cfd9a863631ad0b82dc
FIREBASE_MEASUREMENT_ID=G-GFP64LBLZ3

# ============================================
# ADMIN SECURITY (ENCRYPT THESE IN VERCEL!)
# ============================================
ADMIN_USERNAME=admin@pofgold.com
ADMIN_PASSWORD=IylCWetUuJ783/QgKUCYfY3Qz/U=
ADMIN_PIN=7854
ADMIN_RECOVERY_EMAIL=guampaul@gmail.com
ADMIN_JWT_SECRET=59d0a85c8b964b34c06edc9af4325745113c711221a2430c9c776dd2258dab38
ADMIN_API_KEY=d017de46589c6c48338d5dc2c4c99ef3
ADMIN_SECRET_KEY=1b32a370e5f4011f542aea26622ba9d1
ADMIN_API_ENDPOINT=https://api.pofgold.com/admin

# ============================================
# SECURITY KEYS
# ============================================
ENCRYPTION_KEY=d2c2c3fac155786185fc8c6de1d00aa5bdd04e3758152f9e9c0dbba4c22a8579
HASH_SALT=mnuspR2cdLMby26xOomNeJ21qqI3ViV2vAsUnYFK9nI=

# ============================================
# ANALYTICS (USING FREE GA4)
# ============================================
ANALYTICS_ENDPOINT=https://www.google-analytics.com/collect
ANALYTICS_API_KEY=not_required_for_ga4
ENABLE_ANALYTICS=true
ENABLE_CRASH_REPORTING=true

# ============================================
# APP SETTINGS
# ============================================
NODE_ENV=production
APP_VERSION=1.0.0
REQUIRE_MFA=false
SESSION_TIMEOUT=1800
MAINTENANCE_MODE=false
```

## Security Checklist

- [ ] Save admin password in password manager
- [ ] Enable "Encrypt" toggle for all admin variables in Vercel
- [ ] Add your IP to Firebase authorized domains
- [ ] Set up 2FA on your admin email account
- [ ] Never share these credentials
- [ ] Change admin password after first login
- [ ] Monitor admin access logs regularly

## First Login Instructions

1. Deploy to Vercel first
2. Wait for deployment to complete
3. Visit: https://pofgold.com/admin
4. Login with credentials above
5. Immediately change password in settings
6. Enable 2FA if available

## Emergency Access

If locked out:

1. Use recovery email: guampaul@gmail.com
2. Reset via Vercel environment variables
3. Check Firebase Auth for admin user status

---

**SECURITY WARNING**:

- Delete this file after saving credentials
- Never commit this file to Git
- These are one-time generated credentials
