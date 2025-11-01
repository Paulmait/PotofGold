# Environment Variables Setup Guide

## Required Before App Store Submission

### Firebase Configuration (Required)
```bash
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "your_key"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "your_domain"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "your_id"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "your_bucket"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "your_id"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_APP_ID --value "your_id"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID --value "your_id"
```

### RevenueCat (Required for In-App Purchases)
```bash
eas secret:create --scope project --name REVENUECAT_API_KEY_IOS --value "your_ios_key"
eas secret:create --scope project --name REVENUECAT_API_KEY_ANDROID --value "your_android_key"
```

### Sentry (Recommended for Crash Reporting)
Update `services/crashReporting.ts` line 18 with your actual Sentry DSN

### Optional
```bash
eas secret:create --scope project --name ANALYTICS_API_KEY --value "your_key"
```

## Quick Start for Development

1. Copy `.env.example` to `.env`
2. Fill in your Firebase credentials from Firebase Console
3. Add RevenueCat keys from RevenueCat dashboard
4. Run: `npm start`

## For Production Builds

EAS will automatically use the secrets configured above when building for production.
