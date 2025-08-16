# 🎮 Pot of Gold - Quick Start Testing Guide

## Prerequisites Check

### 1. Install Required Software
```bash
# Check if Node.js is installed (should be v16+)
node --version

# Check if npm is installed
npm --version

# Install Expo CLI globally if not installed
npm install -g expo-cli

# Install EAS CLI for building
npm install -g eas-cli
```

## Option 1: Test with Expo Go (Fastest - Recommended for Initial Testing)

### Step 1: Install Expo Go on Your Phone
- **Android**: Download "Expo Go" from Google Play Store
- **iOS**: Download "Expo Go" from App Store

### Step 2: Start Development Server
```bash
# Navigate to project directory
cd C:\Users\maito\potofgold

# Install dependencies
npm install

# Start Expo development server
npx expo start
```

### Step 3: Connect Your Device
1. Make sure your phone and computer are on the **same WiFi network**
2. Open Expo Go app on your phone
3. **Android**: Scan the QR code displayed in terminal
4. **iOS**: Use Camera app to scan QR code

## Option 2: Test with Development Build (Full Features)

### Step 1: Configure for Local Testing
```bash
# Login to Expo account
eas login

# Configure your project
eas build:configure
```

### Step 2: Build for Android (APK)
```bash
# Build APK for Android
eas build --platform android --profile preview --local

# Or build in the cloud (easier)
eas build --platform android --profile preview
```

### Step 3: Install on Device
1. Download the APK from the link provided after build
2. Transfer to your Android device
3. Enable "Install from Unknown Sources" in Settings
4. Install and run the APK

## Quick Fix Script

Create this file to quickly start testing: