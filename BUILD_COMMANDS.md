# Pot of Gold - Build Commands Guide

## 🚀 Quick Start Scripts

All commands below have corresponding `.bat` files that automatically switch to Node.js 20 to avoid compatibility issues.

### Local Development

```bash
# Start local development server
start-expo.bat
```

- Opens Expo development server
- Scan QR code with Expo Go app on your phone
- Hot reload enabled for live development

### iOS Builds

#### Development Build (for testing)

```bash
build-ios-dev.bat
```

- Creates a development build for iOS
- Can be installed on registered test devices
- Includes development tools and debugging

#### Production Build (for App Store)

```bash
build-ios-prod.bat
```

- Creates a production-ready iOS build
- Optimized and minified
- Ready for App Store submission

#### Submit to App Store

```bash
submit-ios.bat
```

- Submits the latest production build to App Store Connect
- Requires production build to be completed first

### Android Builds

#### Development Build (APK for testing)

```bash
build-android-dev.bat
```

- Creates an APK for development testing
- Can be installed directly on Android devices
- Includes debugging capabilities

#### Production Build (AAB for Play Store)

```bash
build-android-prod.bat
```

- Creates an Android App Bundle (AAB)
- Optimized for Google Play Store
- Smaller download size for users

### Manual Commands (if using Node.js 20 directly)

If you've already switched to Node.js 20 (`nvm use 20.18.1`), you can run:

```bash
# Local development
npm start

# iOS builds
eas build --platform ios --profile development
eas build --platform ios --profile production

# Android builds
eas build --platform android --profile development
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

## 📱 Build Process Overview

1. **First Time Setup**
   - Run `init-eas.bat` to initialize EAS project (one time only)
   - Ensure all credentials are configured in `eas.json`

2. **Development Testing**
   - Use `start-expo.bat` for local testing with Expo Go
   - Build development versions for device testing

3. **Production Release**
   - Build production version
   - Test thoroughly on real devices
   - Submit to app stores

## 🔧 Troubleshooting

### Node.js Version Issues

- All `.bat` scripts automatically switch to Node.js 20
- If manual commands fail, ensure you're using Node.js 20:
  ```bash
  nvm use 20.18.1
  node --version  # Should show v20.18.1
  ```

### Build Failures

- Check that all environment variables are set in `.env`
- Verify credentials in `eas.json` are correct
- Ensure you're logged in to EAS: `eas whoami`

### iOS Specific

- Requires Apple Developer account ($99/year)
- App Store Connect app must be created
- Provisioning profiles managed automatically by EAS

### Android Specific

- Google Play Console account required for store submission ($25 one-time)
- APK for development, AAB for production

## 📊 Build Status

Monitor your builds at: https://expo.dev/accounts/guampaul/projects

## 🎯 Current Configuration

- **Bundle ID**: com.pofgold.potofgold
- **Apple Team ID**: LFB9Z5Q3Y9
- **App Store Connect ID**: 878598219
- **Expo Account**: guampaul

## 📞 Support

- EAS Documentation: https://docs.expo.dev/eas/
- Expo Forums: https://forums.expo.dev/
- Project Issues: Create an issue in your repository
