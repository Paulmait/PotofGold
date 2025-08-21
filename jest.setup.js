// Mock @react-navigation/stack
jest.mock('@react-navigation/stack', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    createStackNavigator: () => {
      const Stack = {};
      Stack.Navigator = ({ children }) => React.createElement(View, null, children);
      Stack.Screen = ({ children }) => React.createElement(View, null, children);
      return Stack;
    },
    StackView: View,
    __esModule: true,
  };
});
// Mock react-native-screens
jest.mock('react-native-screens', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Screen: React.forwardRef((props, ref) => React.createElement(View, { ...props, ref }, props.children)),
    ScreenContainer: React.forwardRef((props, ref) => React.createElement(View, { ...props, ref }, props.children)),
    enableScreens: jest.fn(),
    __esModule: true,
    ...require('react-native-screens/mock'),
  };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: React.forwardRef((props, ref) => React.createElement(View, { ...props, ref }, props.children)),
    SafeAreaView: React.forwardRef((props, ref) => React.createElement(View, { ...props, ref }, props.children)),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 375, height: 812 }),
    initialWindowMetrics: null,
    __esModule: true,
  };
});
// Mock useEntitlements hook
jest.mock('./src/features/subscriptions/useEntitlements', () => ({
  useEntitlements: () => ({ isSubscriber: false, isLoading: false }),
  __esModule: true,
}));

// Mock useSeasonalSkins hook
jest.mock('./hooks/useSeasonalSkins', () => ({
  useSeasonalSkins: () => ({
    activeSeasonalSkins: [],
    isSkinCurrentlyAvailable: () => false,
    isLoading: false,
    error: null,
  }),
  __esModule: true,
}));
// Mock masterGameManager
jest.mock('./utils/masterGameManager', () => ({
  masterGameManager: {
    initializeGame: jest.fn(() => Promise.resolve({
      userId: 'test-user',
      isInitialized: true,
      currentLevel: 1,
      currentWorld: { id: 1 },
      playerProgress: {},
      metaGameProgress: { pots: { currentPot: { speed: 0.5, size: 1 }, currentSkin: { image: 'default_pot' } } },
      missionProgress: {},
      powerUpCollection: {},
      skillProgress: {},
      seasonPass: {},
      dailyStreak: {},
      unlockTree: {},
      adRewards: {},
      lastUpdated: new Date(),
    })),
  },
  __esModule: true,
}));

// Mock metaGameSystem
jest.mock('./utils/metaGameSystem', () => ({
  metaGameSystem: {
    getProgress: jest.fn(() => ({ pots: { currentPot: { speed: 0.5, size: 1 }, currentSkin: { image: 'default_pot' } } })),
  },
  __esModule: true,
}));

// Mock skillMechanicsSystem
jest.mock('./utils/skillMechanics', () => ({
  skillMechanicsSystem: { initializeSkillProgress: jest.fn(() => Promise.resolve({})) },
  __esModule: true,
}));

// Mock missionSystem
jest.mock('./utils/missionSystem', () => ({
  missionSystem: {
    initializeMissions: jest.fn(() => Promise.resolve({})),
    checkMissionRefresh: jest.fn(() => Promise.resolve()),
  },
  __esModule: true,
}));

// Mock seasonPassSystem
jest.mock('./utils/seasonPassSystem', () => ({
  seasonPassSystem: { initializeSeasonPass: jest.fn(() => Promise.resolve({})) },
  __esModule: true,
}));

// Mock dailyStreakSystem
jest.mock('./utils/dailyStreakSystem', () => ({
  dailyStreakSystem: {
    initializeStreak: jest.fn(() => Promise.resolve({})),
    updateStreak: jest.fn(() => Promise.resolve()),
  },
  __esModule: true,
}));

// Mock unlockTreeSystem
jest.mock('./utils/unlockTreeSystem', () => ({
  unlockTreeSystem: { initializeTree: jest.fn(() => Promise.resolve({})) },
  __esModule: true,
}));

// Mock powerUpEvolutionSystem
jest.mock('./utils/powerUpEvolution', () => ({
  powerUpEvolutionSystem: { initializeCollection: jest.fn(() => Promise.resolve({})) },
  __esModule: true,
}));

// Mock progressionSystem
jest.mock('./utils/progressionSystem', () => ({
  progressionSystem: {
    loadPlayerProgress: jest.fn(() => Promise.resolve({ currentWorld: 1 })),
    getCurrentLevel: jest.fn(() => 1),
    getWorlds: jest.fn(() => [{ id: 1 }]),
  },
  __esModule: true,
}));

// Mock pauseTriggerSystem
jest.mock('./utils/pauseTriggerSystem', () => ({
  pauseTriggerSystem: {
    shouldShowPauseMenu: jest.fn(() => false),
    GameContext: {},
  },
  __esModule: true,
}));
// Mock firebase/storage
jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({})),
  __esModule: true,
}));
// Mock firebase/analytics
jest.mock('firebase/analytics', () => ({
  getAnalytics: jest.fn(() => ({})),
  isSupported: jest.fn(() => Promise.resolve(false)),
  __esModule: true,
}));
// Mock firebase/functions
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({})),
  __esModule: true,
}));
// Mock react-native-purchases to prevent NativeEventEmitter errors in tests
jest.mock('react-native-purchases', () => {
  return {
    __esModule: true,
    default: {
      setup: jest.fn(),
      setDebugLogsEnabled: jest.fn(),
      setLogLevel: jest.fn(),
      getOfferings: jest.fn(() => Promise.resolve({})),
      getCustomerInfo: jest.fn(() => Promise.resolve({})),
      purchasePackage: jest.fn(() => Promise.resolve({})),
      restorePurchases: jest.fn(() => Promise.resolve({})),
      addCustomerInfoUpdateListener: jest.fn(),
      removeCustomerInfoUpdateListener: jest.fn(),
      setAttributes: jest.fn(),
      setEmail: jest.fn(),
      setPhoneNumber: jest.fn(),
      setDisplayName: jest.fn(),
      setPushToken: jest.fn(),
      logIn: jest.fn(() => Promise.resolve({})),
      logOut: jest.fn(() => Promise.resolve({})),
      isAnonymous: jest.fn(() => true),
      getAppUserID: jest.fn(() => 'test-user'),
      syncPurchases: jest.fn(),
      setProxyURL: jest.fn(),
      setSimulatesAskToBuyInSandbox: jest.fn(),
      canMakePayments: jest.fn(() => true),
      checkTrialOrIntroductoryPriceEligibility: jest.fn(() => Promise.resolve({})),
      invalidateCustomerInfoCache: jest.fn(),
      setAutomaticAppleSearchAdsAttributionCollection: jest.fn(),
    },
    PurchasesOfferings: {},
    CustomerInfo: {},
    PurchasesEntitlementInfos: {},
    LOG_LEVEL: {},
    PurchasesPackage: {},
    PurchasesError: {},
    PURCHASES_ERROR_CODE: {},
  };
});
// Mock Firebase Firestore (getDoc, setDoc, doc, db, getFirestore)
jest.mock('firebase/firestore', () => ({
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  doc: jest.fn(),
  db: {},
  getFirestore: jest.fn(() => ({})),
  __esModule: true,
}));
// Mock expo-modules-core
jest.mock('expo-modules-core', () => ({
  NativeModule: {},
  NativeModulesProxy: {},
  requireNativeModule: jest.fn(),
  __esModule: true,
}));

// Mock UnlocksContext globally
jest.mock('./context/UnlocksContext', () => ({
  useUnlocks: () => ({
    unlockedFeatures: {
      states: ['gold'],
      backgrounds: ['default'],
      themes: ['default'],
      powerUps: [],
      cartSkins: ['default'],
      specialItems: [],
    },
    unlocks: {
      stateFlags: [],
      cartSkins: ['default'],
      trails: [],
    },
    unlockFeature: jest.fn(),
    isFeatureUnlocked: jest.fn(() => true),
    getUnlockedFeatures: jest.fn(() => []),
    saveUnlocks: jest.fn(),
    loadUnlocks: jest.fn(),
    resetUnlocks: jest.fn(),
    getEquippedCartSkin: jest.fn(() => ({ id: 'default', name: 'Default' })),
    getEquippedTrail: jest.fn(() => null),
    getStateFlag: jest.fn(() => ({ progress: 100 })),
    getTotalUnlocksCount: jest.fn(() => 5),
    equipCartSkin: jest.fn(),
    equipTrail: jest.fn(),
    unlockCartSkin: jest.fn(),
    unlockTrail: jest.fn(),
    upgradePowerUp: jest.fn(),
    loading: false,
    error: null,
  }),
  UnlocksProvider: ({ children }) => children,
  UnlocksContext: {},
  __esModule: true,
}));

// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn(() => Promise.resolve({
        sound: {
          playAsync: jest.fn(),
          unloadAsync: jest.fn(),
          setPositionAsync: jest.fn(),
          pauseAsync: jest.fn(),
          stopAsync: jest.fn(),
          setVolumeAsync: jest.fn(),
          setIsLoopingAsync: jest.fn(),
        },
        status: { isLoaded: true }
      })),
    },
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
  },
  Video: jest.fn(),
  AVPlaybackStatus: {},
  __esModule: true,
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {},
  NotificationFeedbackType: {},
}));
// Global cleanup for timers and mocks after each test
if (typeof global.afterEach === 'function') {
  global.afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    if (typeof global.gc === 'function') {
      global.gc();
    }
  });
}
// jest.setup.js
// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
  useNetInfo: jest.fn(() => ({ isConnected: true })),
}));

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View, ScrollView } = require('react-native');
  const mockComponent = (name) => {
    return React.forwardRef((props, ref) => React.createElement(View, { ...props, ref }, props.children));
  };
  const Animated = {
    View,
    ScrollView,
    createAnimatedComponent: (Component) => Component,
  };
  return {
    Swipeable: mockComponent('Swipeable'),
    DrawerLayout: mockComponent('DrawerLayout'),
    State: {},
    PanGestureHandler: mockComponent('PanGestureHandler'),
    TapGestureHandler: mockComponent('TapGestureHandler'),
    LongPressGestureHandler: mockComponent('LongPressGestureHandler'),
    FlingGestureHandler: mockComponent('FlingGestureHandler'),
    ForceTouchGestureHandler: mockComponent('ForceTouchGestureHandler'),
    PinchGestureHandler: mockComponent('PinchGestureHandler'),
    RotationGestureHandler: mockComponent('RotationGestureHandler'),
    Directions: {},
    gestureHandlerRootHOC: jest.fn((x) => x),
    Animated,
    ScrollView,
    __esModule: true,
    default: View,
  };
});

// Mock react-native-reanimated (if used)
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  // Patch for createAnimatedComponent
  Reanimated.createAnimatedComponent = (Component) => Component;
  Reanimated.default = Reanimated;
  return Reanimated;
});

// Mock Animated from react-native
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock adRewardsSystem
jest.mock('./utils/adRewardsSystem', () => ({
  adRewardsSystem: {
    checkAdAvailability: jest.fn(() => Promise.resolve(true)),
    showAd: jest.fn(() => Promise.resolve()),
    grantReward: jest.fn(() => Promise.resolve()),
    initializeAdRewards: jest.fn(() => Promise.resolve({
      userId: 'test-user',
      watchedAds: [],
      totalAdsWatched: 0,
      totalRewardsEarned: { coins: 0, gems: 0, powerups: 0, skins: 0 },
      activeCampaigns: [],
      dailyAdLimit: 10,
      adsWatchedToday: 0,
      lastAdDate: '',
      lastUpdated: new Date(),
    })),
  },
  __esModule: true,
}));

// Suppress act() warnings globally in tests
const { act } = require('react-test-renderer');
global.act = act;

// Add a global error boundary for unhandled errors in tests
process.on('unhandledRejection', (reason) => {
  // Prevent unhandled promise rejections from failing tests
  // console.error('Unhandled Rejection:', reason);
});
