# Vercel Environment Variables Setup Guide

## 🔐 Setting Up Environment Variables in Vercel

Follow these steps to securely configure your environment variables in Vercel:

### Step 1: Access Vercel Dashboard
1. Go to [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your "pot-of-gold-game" project

### Step 2: Navigate to Settings
1. Click on the "Settings" tab in your project
2. Select "Environment Variables" from the left sidebar

### Step 3: Add Production Environment Variables

Add the following environment variables for **Production** environment:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Your Firebase API Key | Production |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | potofgold-production.firebaseapp.com | Production |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | potofgold-production | Production |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | potofgold-production.firebasestorage.app | Production |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Your Messaging Sender ID | Production |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Your Firebase App ID | Production |
| `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID` | Your Measurement ID | Production |
| `EXPO_PUBLIC_ENV` | production | Production |
| `NODE_ENV` | production | Production |

### Step 4: Add Development/Preview Environment Variables

For **Preview** and **Development** environments, you can use the same values or different Firebase projects:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Your Dev Firebase API Key | Preview, Development |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | potofgold-dev.firebaseapp.com | Preview, Development |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | potofgold-dev | Preview, Development |
| `EXPO_PUBLIC_ENV` | development | Preview, Development |
| `NODE_ENV` | development | Preview, Development |

### Step 5: Secure Sensitive Variables

For admin and sensitive configurations, use Vercel's encrypted environment variables:

1. Click "Add New" environment variable
2. Add these with the "Sensitive" checkbox checked:
   - Any admin credentials
   - API secrets
   - Private keys

**DO NOT** add these to client-side variables (no EXPO_PUBLIC_ prefix):
- Admin passwords
- Admin PINs
- Private API keys
- Database credentials

### Step 6: Verify Configuration

After adding all variables:
1. Click "Save" for each variable
2. Trigger a new deployment to apply the changes
3. Check the deployment logs for any missing variable errors

### Step 7: Local Development

For local development, use your `.env` file (which is gitignored):
```bash
# Copy the example file
cp .env.example .env

# Edit with your local values
nano .env
```

## 🚀 Deployment Commands

After setting up environment variables:

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel

# Link local project to Vercel
vercel link

# Pull environment variables locally
vercel env pull
```

## ⚠️ Important Security Notes

1. **NEVER** commit real API keys to git
2. **ALWAYS** use the `EXPO_PUBLIC_` prefix for client-side variables
3. **ROTATE** your Firebase API keys if they were exposed
4. **USE** different Firebase projects for development and production
5. **ENABLE** Firebase App Check for additional security

## 🔄 Rotating Firebase API Keys

If your keys were compromised:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Project Settings > General
4. Under "Your apps", find your web app
5. Click "Config" to get new configuration
6. Update the values in Vercel
7. Redeploy your application

## 📋 Verification Checklist

- [ ] All production environment variables are set in Vercel
- [ ] Sensitive variables are marked as encrypted
- [ ] Local `.env` file is NOT tracked in git
- [ ] Firebase Security Rules are configured
- [ ] CSP headers allow Firebase domains
- [ ] Test deployment works with new variables
- [ ] Old/exposed API keys are rotated

## 🆘 Troubleshooting

### "Missing Firebase configuration" error
- Ensure all `EXPO_PUBLIC_FIREBASE_*` variables are set
- Check variable names match exactly (case-sensitive)
- Redeploy after adding variables

### "Firebase App not initialized" error
- Verify API key is correct
- Check Firebase project is active
- Ensure domain is authorized in Firebase Console

### CSP blocking Firebase
- Check Content-Security-Policy in vercel.json
- Ensure Firebase domains are whitelisted
- Test in browser console for CSP violations

---

**Remember:** Environment variables are only loaded at build time. You must redeploy after changing them!