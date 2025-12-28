# Pot of Gold - Build & Deployment Guide

## Overview

This guide covers building and deploying the Pot of Gold mobile game to physical devices for testing and production release.

## Current Setup Status

### ✅ Completed

1. **Authentication System**
   - User registration/login with Firebase Auth
   - Forgot password functionality
   - Admin authentication
   - Offline persistence with AsyncStorage

2. **Database Integration**
   - Firebase Firestore for user profiles
   - Game progress saving
   - Admin user management
   - Offline sync queue

3. **Admin Panel**
   - User management dashboard
   - Reset user progress
   - Grant premium access
   - Add coins to accounts
   - Delete user accounts

4. **Crash Reporting**
   - Sentry integration configured
   - Performance monitoring
   - Game-specific metrics tracking
   - Error context capture

5. **Game Systems**
   - All game screens implemented
   - State unlocking system
   - Shop and skin system
   - Leaderboards
   - Settings persistence

## Building for Physical Devices

### Prerequisites

1. Install EAS CLI globally:

   ```bash
   npm install -g eas-cli
   ```

2. Create an Expo account:

   ```bash
   eas login
   ```

3. Configure your project:
   ```bash
   eas build:configure
   ```

### Firebase Configuration

Before building, update the Firebase configuration in `firebase/firebase.ts`:

```javascript
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};
```

### Sentry Configuration

Update the Sentry DSN in `services/crashReporting.ts`:

```javascript
const SENTRY_DSN = 'YOUR_SENTRY_DSN_HERE';
```

## Building APK for Android

### Development Build (with Expo Dev Client)

```bash
eas build --platform android --profile development
```

### Preview Build (Standalone APK)

```bash
eas build --platform android --profile preview
```

### Production Build (AAB for Google Play)

```bash
eas build --platform android --profile production
```

## Building for iOS

### Development Build

```bash
eas build --platform ios --profile development
```

### Preview Build (Ad Hoc)

```bash
eas build --platform ios --profile preview
```

### Production Build (App Store)

```bash
eas build --platform ios --profile production
```

## Testing on Physical Device

### Android

1. After build completes, download the APK from the Expo dashboard
2. Transfer APK to your device via:
   - Email
   - Google Drive
   - USB cable
   - QR code from EAS build page
3. Enable "Install from Unknown Sources" in device settings
4. Install and run the APK

### iOS

1. For development/preview builds, register device UDID:
   ```bash
   eas device:create
   ```
2. Download the IPA file
3. Install via:
   - TestFlight (production builds)
   - Ad Hoc distribution (preview builds)
   - Xcode (development builds)

## Environment Variables

The app uses different configurations based on the build profile:

- **Development**: `EXPO_PUBLIC_ENV=development`
- **Preview**: `EXPO_PUBLIC_ENV=preview`
- **Production**: `EXPO_PUBLIC_ENV=production`

## App Store Submission

### Google Play Store

1. Build production AAB:
   ```bash
   eas build --platform android --profile production
   ```
2. Configure submit settings in `eas.json`
3. Submit to Play Store:
   ```bash
   eas submit --platform android
   ```

### Apple App Store

1. Build production IPA:
   ```bash
   eas build --platform ios --profile production
   ```
2. Configure App Store Connect settings
3. Submit to App Store:
   ```bash
   eas submit --platform ios
   ```

## Testing Checklist

Before deploying to production, ensure:

- [ ] All tests pass (`npm test`)
- [ ] Authentication flow works (signup, login, forgot password)
- [ ] Game saves and loads progress correctly
- [ ] Admin panel functions properly
- [ ] Crash reporting captures errors
- [ ] Performance is acceptable on low-end devices
- [ ] All UI components render correctly
- [ ] Sound and haptics work as expected
- [ ] In-app purchases are configured (if applicable)
- [ ] Offline mode works correctly

## Monitoring

### Crash Reports

Monitor crashes and errors at your Sentry dashboard:

- Real-time error tracking
- Performance metrics
- User session replays

### Analytics

Track user engagement and game metrics through:

- Firebase Analytics (if configured)
- Custom game events in Sentry

## Troubleshooting

### Build Fails

- Ensure all dependencies are installed: `npm install`
- Clear cache: `npx expo start --clear`
- Update EAS CLI: `npm install -g eas-cli@latest`

### App Crashes on Launch

- Check Firebase configuration is correct
- Verify all required permissions are granted
- Review crash reports in Sentry

### Authentication Issues

- Verify Firebase Auth is enabled
- Check network connectivity
- Review offline sync queue

## Support

For issues or questions:

- Check EAS Build logs in Expo dashboard
- Review Sentry error reports
- Check Firebase console for auth/database issues

## Next Steps

1. **Configure Firebase Project**
   - Create Firebase project at https://console.firebase.google.com
   - Enable Authentication (Email/Password)
   - Create Firestore database
   - Add Android/iOS apps with correct bundle IDs

2. **Set up Sentry**
   - Create project at https://sentry.io
   - Get DSN for React Native
   - Configure source maps for better debugging

3. **Configure EAS Project**
   - Link to Expo account: `eas init`
   - Set project ID in app.json

4. **Build and Test**
   - Start with preview build for testing
   - Test all features thoroughly
   - Monitor crash reports and performance

5. **Prepare for Store Release**
   - Create app store listings
   - Prepare screenshots and descriptions
   - Set up in-app purchases (if needed)
   - Submit for review

## Important Notes

- The app currently uses placeholder Firebase config - must be updated before building
- Sentry DSN needs to be configured for crash reporting to work
- Admin users must be manually added to Firebase 'admins' collection
- EAS project ID must be set in app.json before building

---

Last Updated: Current Session
Status: Ready for Firebase/Sentry configuration and EAS build
