# 🧪 Complete Testing & Deployment Guide

## 🔐 Admin Credentials for Testing

### Admin Access
```
Username: admin@potofgold
Password: PotG0ld@dm1n2024!
PIN: 7531
```

### Test Accounts
```
Moderator: moderator@potofgold / Mod3rat0r2024!
Support: support@potofgold / Supp0rt2024!
```

---

## 🚀 Quick Start Commands

### Step 1: Install Dependencies
```bash
cd C:\Users\maito\potofgold
npm install
```

### Step 2: Generate App Assets
```bash
# Generate all app icons
npm run generate:icons

# Generate screenshots for stores
npm run generate:screenshots

# Generate both
npm run generate:assets
```

### Step 3: Start Development Server
```bash
# Start with clean cache
npm run start:clean

# Or regular start
npm start
```

---

## 📱 iOS Testing (Mac Required)

### Prerequisites
- macOS 10.15 or later
- Xcode 14 or later
- Apple Developer Account ($99/year)
- CocoaPods installed

### Setup iOS Environment
```bash
# Install iOS dependencies
cd ios
pod install
cd ..

# Open Xcode project (optional)
open ios/PotOfGold.xcworkspace
```

### Test on iOS Simulator
```bash
# List available simulators
xcrun simctl list devices

# Run on default simulator
npm run ios

# Run on specific simulator
npm run ios:simulator
# Or specify different device:
npx expo run:ios --simulator="iPhone 14 Pro Max"
```

### Test on Physical iPhone
```bash
# Connect iPhone via USB
# Enable Developer Mode on iPhone (Settings > Privacy & Security)

# Run on device
npm run ios:device
```

### Build for TestFlight
```bash
# Login to EAS
npx eas login

# Build for TestFlight
npm run build:ios:prod

# Submit to App Store Connect
npm run submit:ios
```

---

## 🤖 Android Testing

### Prerequisites
- Android Studio
- Java 11 or later
- Android SDK (API 33)
- Android device or emulator

### Setup Android Environment
```bash
# Set environment variables (Windows)
setx ANDROID_HOME "%LOCALAPPDATA%\Android\Sdk"
setx PATH "%PATH%;%ANDROID_HOME%\platform-tools"

# Verify setup
adb devices
```

### Start Android Emulator
```bash
# List available emulators
emulator -list-avds

# Start emulator (if not already running)
emulator -avd Pixel_7_API_33
```

### Test on Android Emulator
```bash
# Run on emulator
npm run android:emulator

# Or use Expo
npm run android
```

### Test on Physical Android Device
```bash
# Enable Developer Options on device
# Enable USB Debugging
# Connect device via USB

# Verify device connected
adb devices

# Run on device
npm run android:device
```

### Build APK for Testing
```bash
# Build debug APK
npm run build:android:dev

# Build release APK
npm run build:android:prod
```

---

## 🌐 Web Testing (Bonus)
```bash
# Test in browser
npm run web

# Open in specific browser
npx expo start --web --browser chrome
```

---

## 🧪 Comprehensive Testing Flow

### 1. Run All Tests
```bash
# TypeScript check
npm run typecheck

# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run security tests
npm run test:security
```

### 2. Test Game Features
```
✅ Navigation
- [ ] All screens accessible
- [ ] Back button works
- [ ] No navigation loops

✅ Gameplay
- [ ] Coins spawn correctly
- [ ] Pot movement smooth
- [ ] Score increments properly
- [ ] Power-ups activate

✅ Shop & Purchases
- [ ] Items display with correct prices
- [ ] Purchase flow completes
- [ ] Currency deducts properly
- [ ] Items equip/unequip

✅ Settings
- [ ] Sound toggle works
- [ ] Haptics toggle works
- [ ] Quality settings apply
- [ ] Data saves correctly

✅ Network
- [ ] Works offline
- [ ] Syncs when online
- [ ] Handles network changes
```

### 3. Performance Testing
```bash
# Monitor performance while playing
adb logcat | grep "FPS\|Memory"

# Check memory usage
adb shell dumpsys meminfo com.yourcompany.potofgold

# Check battery usage
adb shell dumpsys batterystats
```

---

## 📦 Build & Deploy

### Configure EAS
```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo account
eas login

# Configure project (first time only)
eas build:configure
```

### Build for Production

#### iOS Production Build
```bash
# Build for App Store
npm run build:ios:prod

# Download .ipa file when ready
# Upload to App Store Connect via Transporter or
npm run submit:ios
```

#### Android Production Build
```bash
# Build AAB for Play Store
npm run build:android:prod

# Download .aab file when ready
# Upload to Play Console or
npm run submit:android
```

### Build All Platforms
```bash
# Build both iOS and Android
npm run build:all

# Submit to both stores
npm run submit:all
```

---

## 📋 Pre-Submission Checklist

### Required Information
```
✅ App Name: Pot of Gold - Coin Catcher
✅ Bundle ID iOS: com.yourcompany.potofgold
✅ Package Name Android: com.yourcompany.potofgold
✅ Version: 1.0.0
✅ Category: Games/Casual
✅ Age Rating: 4+
✅ Price: Free with In-App Purchases
```

### Required URLs
```
✅ Privacy Policy: https://potofgold.app/privacy
✅ Terms of Service: https://potofgold.app/terms
✅ Support: https://potofgold.app/support
✅ Marketing: https://potofgold.app
```

### Store Assets Ready
```
✅ App Icons
- [ ] iOS: All sizes generated
- [ ] Android: All densities generated

✅ Screenshots
- [ ] iOS: 5 sizes, 3-10 screenshots each
- [ ] Android: 2-8 screenshots

✅ Feature Graphic (Android)
- [ ] 1024x500 PNG

✅ App Preview Video (Optional)
- [ ] 15-30 seconds
- [ ] Show gameplay
```

### Testing Complete
```
✅ Functionality
- [ ] All features work
- [ ] No crashes
- [ ] Purchases work

✅ Performance
- [ ] 60fps on target devices
- [ ] <3 second load time
- [ ] <200MB memory usage

✅ Security
- [ ] Data encrypted
- [ ] Input validated
- [ ] Anti-cheat active

✅ Compliance
- [ ] GDPR compliant
- [ ] COPPA compliant
- [ ] Age appropriate
```

---

## 🚨 Troubleshooting

### Common Issues & Solutions

#### Metro bundler issues
```bash
# Clear cache and restart
npx expo start -c
```

#### iOS build fails
```bash
# Clean and rebuild
cd ios
pod deintegrate
pod install
cd ..
npm run prebuild:clean
```

#### Android build fails
```bash
# Clean gradle
cd android
./gradlew clean
cd ..
npm run prebuild:clean
```

#### Device not connecting
```bash
# iOS: Trust computer on device
# Android: Enable USB debugging

# Verify connection
adb devices  # Android
xcrun simctl list  # iOS
```

#### EAS build fails
```bash
# Check credentials
eas credentials

# Clear and rebuild
eas build --clear-cache
```

---

## 📊 Monitoring After Launch

### Analytics to Track
- Daily Active Users (DAU)
- Session Length
- Retention (D1, D7, D30)
- Conversion Rate
- Revenue per User
- Crash Rate
- Performance Metrics

### Tools Setup
- Firebase Analytics
- RevenueCat Dashboard
- Sentry for Crashes
- Google Play Console
- App Store Connect

---

## 🎯 Success Metrics

### Launch Goals
- **Day 1**: 1,000+ downloads
- **Week 1**: 4.5+ star rating
- **Month 1**: 10,000+ active users
- **Conversion**: 2-5% to paid
- **Retention**: 40% D1, 20% D7, 10% D30

### Quality Targets
- **Crash Rate**: <0.1%
- **ANR Rate**: <0.05%
- **Load Time**: <3 seconds
- **FPS**: 60fps on 90% devices
- **Memory**: <200MB average

---

## 📞 Support Information

### Developer Support
- Expo Forums: https://forums.expo.dev
- React Native: https://reactnative.dev/help
- EAS Status: https://status.expo.dev

### Store Support
- App Store Connect: https://appstoreconnect.apple.com
- Google Play Console: https://play.google.com/console
- RevenueCat: https://app.revenuecat.com

---

## 🎉 Launch Day Checklist

### Before Launch
- [ ] Test purchases work
- [ ] Analytics tracking
- [ ] Crash reporting active
- [ ] Support email ready
- [ ] Social media prepared

### Launch Day
- [ ] Monitor crash reports
- [ ] Respond to reviews
- [ ] Track analytics
- [ ] Share on social media
- [ ] Celebrate! 🎊

---

**Your app is ready for testing and deployment! Follow these steps carefully for a successful launch.** 🚀

## Quick Test Commands Summary
```bash
# Complete test flow
cd C:\Users\maito\potofgold
npm install
npm run generate:assets
npm run start:clean

# Test iOS (Mac only)
npm run ios:simulator

# Test Android
npm run android:emulator

# Build for stores
npm run build:all

# Submit to stores
npm run submit:all
```

**Good luck with your app launch!** 🍀💰