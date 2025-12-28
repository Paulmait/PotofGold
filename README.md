# 🏆 Pot of Gold - React Native Game

**Catch falling coins, collect power-ups, and challenge friends in this addictive mobile game!**

[![React Native](https://img.shields.io/badge/React%20Native-0.73.2-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-50.0.0-blue.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.1.3-blue.svg)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.7.1-orange.svg)](https://firebase.google.com/)

## 📱 Screenshots

### 🏠 Home Screen

![Home Screen](screenshots/home-screen.png)
_Beautiful gradient background with game stats and navigation_

### 🎮 Game Screen

![Game Screen](screenshots/game-screen.png)
_Smooth gameplay with falling coins and power-ups_

### 🏪 Store Screen

![Store Screen](screenshots/store-screen.png)
_Purchase upgrades and power-ups with in-game coins_

### 🤝 Challenge Friends

![Challenge Screen](screenshots/challenge-screen.png)
_Challenge friends to 60-second competitive matches_

### 📊 Leaderboard

![Leaderboard](screenshots/leaderboard-screen.png)
_Global and friends leaderboards with real-time updates_

## ✨ Features

### 🎯 Core Gameplay

- **Touch Controls**: Smooth pan gesture handling for pot movement
- **Falling Coins**: Physics-based coin spawning with varying values
- **Power-ups**: Magnet, Double Points, Slow Motion, Gold Rush
- **Gold Rush Mode**: Special event with coin rain and glowing effects
- **Progressive Difficulty**: Speed increases over time

### 🎵 Audio & Visual

- **Sound Effects**: Coin collection, power-up activation, button clicks
- **Haptic Feedback**: Tactile response on interactions
- **Animations**: Smooth 60fps animations with native driver
- **Visual Effects**: Glowing backgrounds, particle effects, power-up indicators

### 💰 Monetization

- **RevenueCat Integration**: Cross-platform in-app purchases
- **Coin Packages**: Various coin amounts for purchase
- **Remove Ads**: One-time purchase to disable ads
- **Premium Power-ups**: Special power-up bundles

### 🤝 Multiplayer Features

- **Challenge Friends**: Send 60-second challenges
- **Real-time Leaderboards**: Global and friends rankings
- **Challenge History**: Track win/loss results
- **Firebase Integration**: Real-time data synchronization

### 🔧 Technical Excellence

- **Performance Optimized**: React.memo, useCallback, native animations
- **Modular Architecture**: Custom hooks for game logic
- **TypeScript**: Full type safety and better development experience
- **Cross-platform**: iOS and Android support via Expo

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/pot-of-gold.git
cd pot-of-gold
```

2. **Install dependencies**

```bash
npm install
```

3. **Start the development server**

```bash
npm start
```

4. **Run on device/simulator**

```bash
# iOS
npm run ios

# Android
npm run android
```

## 🏗️ Project Structure

```
pot-of-gold/
├── App.tsx                 # Main app entry point
├── assets/                 # Images, sounds, and static assets
│   ├── images/            # Game graphics
│   └── sfx/              # Sound effects
├── components/            # Reusable UI components
│   ├── Coin.tsx          # Coin component with animations
│   ├── Pot.tsx           # Player pot component
│   └── PowerUp.tsx       # Power-up component
├── screens/              # Game screens
│   ├── HomeScreen.tsx    # Main menu
│   ├── GameScreen.tsx    # Core gameplay
│   ├── StoreScreen.tsx   # In-game store
│   ├── BuyGoldScreen.tsx # RevenueCat purchases
│   ├── ChallengeFriendsScreen.tsx # Multiplayer challenges
│   ├── LeaderboardScreen.tsx # Rankings
│   ├── UpgradeScreen.tsx # Player upgrades
│   ├── SettingsScreen.tsx # Game settings
│   ├── StatsScreen.tsx   # Player statistics
│   └── GameOverScreen.tsx # End game screen
├── hooks/                # Custom React hooks
│   ├── useGoldRush.ts    # Gold rush logic
│   ├── useSpawnCoins.ts  # Coin spawning
│   └── usePowerups.ts    # Power-up management
├── context/              # React Context
│   └── GameContext.tsx   # Global game state
├── navigation/           # Navigation setup
│   └── index.tsx        # Screen routing
├── utils/               # Utility functions
│   └── physics.ts       # Game physics logic
├── firebase/            # Firebase configuration
│   └── config.ts        # Firebase setup
└── package.json         # Dependencies and scripts
```

## 🎮 Game Modes

### Single Player

- **Classic Mode**: Endless gameplay with increasing difficulty
- **Score Tracking**: Persistent high scores and statistics
- **Achievements**: Unlock achievements through gameplay

### Challenge Mode

- **60-Second Rounds**: Quick competitive matches
- **Friend Challenges**: Challenge specific friends
- **Real-time Results**: Compare scores instantly

### Multiplayer Features

- **Global Leaderboards**: Compete worldwide
- **Friends Rankings**: Compare with friends
- **Challenge History**: Track past matches

## 💰 In-App Purchases

### RevenueCat Integration

- **Cross-platform**: Works on iOS and Android
- **Secure**: Automatic receipt validation
- **Analytics**: Purchase tracking and insights

### Available Products

- **Coin Packages**: 100 to 10,000 coins
- **Remove Ads**: One-time purchase
- **Premium Power-ups**: Special bundles
- **Gold Rush Pass**: Unlimited gold rush activations

## 🔧 Configuration

### Firebase Setup

1. Create a Firebase project
2. Enable Authentication, Firestore, and Analytics
3. Update `firebase/config.ts` with your credentials

### RevenueCat Setup

1. Create a RevenueCat account
2. Configure products in RevenueCat dashboard
3. Update API key in `screens/BuyGoldScreen.tsx`

### Sound Effects

Place your sound files in `assets/sfx/`:

- `coin.wav` - Coin collection sound
- `powerup.wav` - Power-up activation sound
- `goldrush.wav` - Gold rush event sound
- `button.wav` - UI interaction sound

## 📊 Performance Optimizations

### React.memo Components

- All game components optimized for re-rendering
- Stable function references with useCallback
- Efficient state management

### Animation Performance

- Native driver for 60fps animations
- Optimized collision detection
- Efficient object pooling

### Memory Management

- Proper cleanup of timers and animations
- Efficient sound loading and unloading
- Optimized game loop

## 🚀 Deployment

### Expo EAS Build

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

### App Store Submission

```bash
# Submit to App Store
eas submit --platform ios

# Submit to Google Play
eas submit --platform android
```

## 🛠️ Development

### Available Scripts

```bash
npm start          # Start Expo development server
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm run web        # Run on web browser
npm run build:ios  # Build for iOS
npm run build:android # Build for Android
```

### Code Quality

- **TypeScript**: Full type safety
- **ESLint**: Code linting and formatting
- **Prettier**: Consistent code formatting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Native**: Cross-platform mobile development
- **Expo**: Development tools and services
- **Firebase**: Backend services and real-time data
- **RevenueCat**: In-app purchase management
- **Expo Haptics**: Tactile feedback
- **Expo Audio**: Sound effects

## 📞 Support

For support, email support@potofgold.com or join our Discord community.

---

**Made with ❤️ by the Pot of Gold team**
