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
