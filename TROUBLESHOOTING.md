# 🔧 Troubleshooting Guide

## Common Issues and Solutions

### ❌ "Unable to resolve module" Error

**Solution:**

```bash
# Clear all caches
npx expo start --clear
npm start -- --reset-cache

# If still not working
rm -rf node_modules
npm install
```

### ❌ "Network response timed out"

**Causes & Solutions:**

1. **Firewall blocking connection**
   - Add Node.js to Windows Firewall exceptions
   - Temporarily disable Windows Defender Firewall for testing

2. **Different networks**
   - Ensure phone and PC are on SAME WiFi
   - Or use tunnel mode: `npx expo start --tunnel`

3. **Router isolation**
   - Some routers isolate devices
   - Try using mobile hotspot from phone

### ❌ "Metro bundler crashed"

**Solution:**

```bash
# Kill all Node processes
taskkill /f /im node.exe

# Clear temp files
del %TEMP%\metro-cache /s /q
del %TEMP%\haste-map* /s /q

# Restart
npm start
```

### ❌ Expo Go app crashes immediately

**Possible causes:**

1. **Version mismatch**
   - Update Expo Go app
   - Update Expo SDK: `expo upgrade`

2. **Missing dependencies**

   ```bash
   npm install
   npx expo install --fix
   ```

3. **Firebase not configured**
   - App works in test mode without Firebase
   - Check config/testConfig.js

### ❌ Black screen on device

**Solutions:**

1. **Check console for errors**
   - Look at terminal for red error messages
   - Check device logs: `adb logcat` (Android)

2. **Verify assets loading**

   ```bash
   # Check if assets exist
   dir assets\images
   ```

3. **Reset Expo Go app**
   - Clear app data/cache on phone
   - Reinstall Expo Go

### ❌ "Firebase not configured" Error

**For testing without Firebase:**

1. The app has test mode enabled
2. Uses local storage instead of Firebase
3. No login required for testing

**To use Firebase:**

1. Create Firebase project
2. Update `firebase/firebase.ts` with your config
3. Enable Authentication and Firestore

### ❌ Touch controls not working

**Solutions:**

1. **Check gesture handler**

   ```bash
   npm install react-native-gesture-handler
   npx expo install react-native-gesture-handler
   ```

2. **Restart after installation**
   - Close Expo Go completely
   - Restart development server

### ❌ Performance issues / Lag

**Optimizations:**

1. **Enable production mode**

   ```bash
   npx expo start --no-dev --minify
   ```

2. **Reduce console logs**
   - Remove console.log statements
   - Disable remote debugging

3. **Check memory usage**
   - Close other apps on phone
   - Restart phone if needed

## Quick Fixes Script

Run this to fix most common issues:

```bash
# Windows
test-device.bat

# Or manually:
npx expo start --clear
```

## Testing Without Firebase

The app includes a test mode that works without Firebase:

1. Uses AsyncStorage for data
2. Mock authentication
3. All features available offline

## Device-Specific Issues

### Android

- Enable USB Debugging
- Install Expo Go from Play Store
- Allow "Install Unknown Apps" for APK testing

### iOS

- Install Expo Go from App Store
- Trust computer when prompted
- Allow local network access

## Network Testing Options

1. **Same WiFi** (Fastest)
   - Both devices on same network
   - Use QR code

2. **Tunnel** (Works anywhere)
   - Works over internet
   - Command: `npx expo start --tunnel`

3. **USB** (Android only)
   - Most stable
   - Requires ADB

4. **Hotspot**
   - Create hotspot from phone
   - Connect PC to phone's hotspot

## Getting Help

1. **Check logs**

   ```bash
   # See all output
   npx expo start --verbose
   ```

2. **Discord/Forums**
   - Expo Discord: https://chat.expo.dev
   - Stack Overflow: Tag with 'expo'

3. **Reset everything**
   ```bash
   # Nuclear option - reset all
   rm -rf node_modules
   rm package-lock.json
   npm cache clean --force
   npm install
   npx expo start --clear
   ```

## Emergency Contacts

- Expo Status: https://status.expo.dev
- GitHub Issues: https://github.com/expo/expo/issues
