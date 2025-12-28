# ✅ Pre-Testing Checklist

## Before You Start Testing

### 📱 Phone Setup

- [ ] Expo Go app installed from app store
- [ ] Phone connected to WiFi (same as PC)
- [ ] Phone has at least 500MB free space
- [ ] Phone battery > 20%
- [ ] Developer mode enabled (Android)

### 💻 PC Setup

- [ ] Node.js v16+ installed
- [ ] Project dependencies installed (`npm install`)
- [ ] Windows Firewall allows Node.js
- [ ] Terminal/Command Prompt ready

### 🎮 Quick Start Commands

```bash
# Option 1: Easy start (double-click)
test-device.bat

# Option 2: Manual start
cd C:\Users\maito\potofgold
npm install  # First time only
npx expo start --clear
```

### 📲 Connect Your Device

1. **See QR code in terminal?**
   - Android: Open Expo Go → Scan QR
   - iOS: Open Camera → Scan QR

2. **Can't scan QR?**
   - Type the URL shown in terminal into Expo Go
   - Example: `exp://192.168.1.100:8081`

### 🎯 What to Test

#### Basic Functionality

- [ ] Game loads without errors
- [ ] Cart moves left/right with touch
- [ ] Items fall from top
- [ ] Collision detection works
- [ ] Score increases when collecting items

#### Touch Controls

- [ ] Drag to move cart
- [ ] Tap power-up buttons
- [ ] Pause button works
- [ ] All buttons are easy to tap (48dp+)

#### Visual Effects

- [ ] Particles appear on collection
- [ ] Trail effects show
- [ ] Animations are smooth
- [ ] No overlapping items

#### Game Features

- [ ] Power-ups activate correctly
- [ ] Blocking items spawn
- [ ] Legendary status displays
- [ ] Save/resume works

### 🚀 Performance Check

- [ ] Smooth 60fps gameplay
- [ ] No lag when many items on screen
- [ ] Touch response is immediate
- [ ] Memory usage stable

### 🔍 If Something Goes Wrong

1. **Check terminal for errors** (red text)
2. **Try:** `npx expo start --clear`
3. **See TROUBLESHOOTING.md**
4. **Restart everything if needed**

### 📊 Testing Feedback Template

```
Device: [Phone model]
OS: [Android/iOS version]
Network: [WiFi/Cellular/USB]

What worked:
-
-

Issues found:
-
-

Performance:
- FPS: [Smooth/Laggy]
- Load time: [Fast/Slow]
- Memory: [Stable/Increasing]

Suggestions:
-
-
```

## Ready to Test! 🎮

1. Run: `test-device.bat`
2. Choose connection type
3. Scan QR code
4. Play the game!

Remember: The game works in TEST MODE without Firebase!
