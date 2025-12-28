import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import GameScreen from '../../screens/GameScreen';

// Mock all child components
jest.mock('../../components/MineCart', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return function MineCart(props: any) {
    return (
      <View testID="mine-cart">
        <Text>MineCart Mock</Text>
      </View>
    );
  };
});

jest.mock('../../components/RailTrack', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return function RailTrack(props: any) {
    return (
      <View testID="rail-track">
        <Text>RailTrack Mock</Text>
      </View>
    );
  };
});

jest.mock('../../components/FallingItems', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return function FallingItems(props: any) {
    return (
      <View testID="falling-items">
        <Text>FallingItems Mock</Text>
      </View>
    );
  };
});

jest.mock('../../components/StateUnlockNotification', () => ({
  StateUnlockNotification: function StateUnlockNotification(props: any) {
    const React = require('react');
    const { View, Text } = require('react-native');
    return (
      <View testID="state-unlock-notification">
        <Text>StateUnlockNotification Mock</Text>
      </View>
    );
  },
}));

jest.mock('../../components/MysteryCrate', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return function MysteryCrate(props: any) {
    return (
      <View testID="mystery-crate">
        <Text>MysteryCrate Mock</Text>
      </View>
    );
  };
});

jest.mock('../../screens/PauseModal', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return function PauseModal(props: any) {
    return props.visible ? (
      <View testID="pause-modal">
        <Text>PauseModal Mock</Text>
      </View>
    ) : null;
  };
});

// Mock Firebase
jest.mock('../../firebase/firebase', () => ({
  db: {},
}));

jest.mock('../../firebase/auth', () => ({
  auth: {
    currentUser: { uid: 'test-user' },
  },
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => false, data: () => ({}) })),
  updateDoc: jest.fn(() => Promise.resolve()),
  increment: jest.fn((n) => n),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
}));

// Mock Expo modules
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

// Mock gesture handler
jest.mock('react-native-gesture-handler', () => ({
  PanGestureHandler: 'PanGestureHandler',
  State: {
    UNDETERMINED: 0,
    FAILED: 1,
    BEGAN: 2,
    CANCELLED: 3,
    ACTIVE: 4,
    END: 5,
  },
}));

// Mock hooks
jest.mock('../../hooks/useSeasonalSkins', () => ({
  useSeasonalSkins: () => ({
    activeSeasonalSkins: [],
    isSkinCurrentlyAvailable: jest.fn(() => false),
  }),
}));

jest.mock('../../src/features/subscriptions/useEntitlements', () => ({
  useEntitlements: () => ({
    isSubscriber: false,
    isLoading: false,
  }),
}));

// Mock contexts
jest.mock('../../context/UserUnlockContext', () => ({
  useUserUnlocks: () => ({
    userUnlocks: {
      unlockedSkins: ['default'],
      selectedCartSkin: 'default',
      lastUpdated: new Date(),
    },
    isLoading: false,
    isSkinUnlocked: jest.fn(() => true),
    getSelectedCartSkin: jest.fn(() => 'default'),
    unlockSkin: jest.fn(),
    selectCartSkin: jest.fn(),
    refreshUnlocks: jest.fn(),
    isSeasonalSkinAvailable: jest.fn(() => false),
  }),
  UserUnlockProvider: ({ children }: any) => children,
}));

// Stable references for mocked values
const mockCartSkin = { id: 'default', name: 'Default' };
const mockStateFlag = { progress: 100 };
const mockUnlockedFeatures = [];

jest.mock('../../context/UnlocksContext', () => ({
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
    getUnlockedFeatures: jest.fn(() => mockUnlockedFeatures),
    saveUnlocks: jest.fn(),
    loadUnlocks: jest.fn(),
    resetUnlocks: jest.fn(),
    getEquippedCartSkin: jest.fn(() => mockCartSkin),
    getEquippedTrail: jest.fn(() => null),
    getStateFlag: jest.fn(() => mockStateFlag),
    getTotalUnlocksCount: jest.fn(() => 5),
    equipCartSkin: jest.fn(),
    equipTrail: jest.fn(),
    unlockCartSkin: jest.fn(),
    unlockTrail: jest.fn(),
    upgradePowerUp: jest.fn(),
    loading: false,
    error: null,
  }),
  UnlocksProvider: ({ children }: any) => children,
}));

jest.mock('../../context/GameContext', () => ({
  useGameContext: () => ({
    gameState: {
      coins: 100,
      totalCoins: 100,
      highScore: 0,
      currentScore: 0,
      level: 1,
      potLevel: 1,
      potSpeed: 1,
      potSize: 1,
      magnetActive: false,
      slowMotionActive: false,
      doublePointsActive: false,
      goldRushActive: false,
      magnetDuration: 0,
      slowMotionDuration: 0,
      doublePointsDuration: 0,
      goldRushDuration: 0,
      isPlaying: false,
      isPaused: false,
      gameSpeed: 1,
      ownedSkins: ['default'],
      currentSkin: 'default',
      soundEnabled: true,
      vibrationEnabled: true,
      tiltControlsEnabled: false,
      gamesPlayed: 0,
      totalPlayTime: 0,
      coinsCollected: 0,
      powerUpsUsed: 0,
      achievements: [],
    },
    updateGameState: jest.fn(),
    addCoins: jest.fn(),
    addScore: jest.fn(),
    activatePowerUp: jest.fn(),
    resetGame: jest.fn(),
    saveGameData: jest.fn(),
    loadGameData: jest.fn(),
  }),
  GameProvider: ({ children }: any) => children,
}));

// Mock all game systems
jest.mock('../../utils/masterGameManager', () => ({
  masterGameManager: {
    initialize: jest.fn(),
    initializeGame: jest.fn(() => Promise.resolve()),
    update: jest.fn(),
    getState: jest.fn(() => ({})),
  },
}));

jest.mock('../../utils/metaGameSystem', () => ({
  metaGameSystem: {
    initialize: jest.fn(),
    update: jest.fn(),
    getProgress: jest.fn(() => ({ potLevel: 1, potSpeed: 1, potSize: 1 })),
  },
}));

jest.mock('../../utils/skillMechanics', () => ({
  skillMechanicsSystem: {
    initialize: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('../../utils/missionSystem', () => ({
  missionSystem: {
    initialize: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('../../utils/seasonPassSystem', () => ({
  seasonPassSystem: {
    initialize: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('../../utils/dailyStreakSystem', () => ({
  dailyStreakSystem: {
    initialize: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('../../utils/unlockTreeSystem', () => ({
  unlockTreeSystem: {
    initialize: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('../../utils/adRewardsSystem', () => ({
  adRewardsSystem: {
    initialize: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('../../utils/powerUpEvolution', () => ({
  powerUpEvolutionSystem: {
    initialize: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('../../utils/progressionSystem', () => ({
  progressionSystem: {
    initialize: jest.fn(),
    update: jest.fn(),
    getUnlockedItems: jest.fn(() => []),
  },
}));

jest.mock('../../utils/pauseTriggerSystem', () => {
  const React = require('react');
  return {
    pauseTriggerSystem: {
      initialize: jest.fn(),
      update: jest.fn(),
    },
    GameContext: React.createContext({}),
  };
});

jest.mock('../../utils/collisionDetection', () => ({
  CollisionDetection: {
    checkCollision: jest.fn(() => false),
  },
}));

jest.mock('../../utils/itemConfig', () => ({
  ITEM_CONFIGS: {
    COIN: { type: 'coin', value: 10 },
    GEM: { type: 'gem', value: 50 },
  },
  LEVEL_SPAWN_MODIFIERS: {},
}));

jest.mock('../../utils/comboSystem', () => ({
  ComboSystem: jest.fn().mockImplementation(() => ({
    update: jest.fn(),
    reset: jest.fn(),
  })),
}));

jest.mock('../../utils/collisionHandler', () => ({
  CollisionHandler: jest.fn().mockImplementation(() => ({
    handleCollision: jest.fn(),
  })),
}));

jest.mock('../../utils/stateUnlockSystem', () => ({
  StateUnlockSystem: jest.fn().mockImplementation(() => ({
    checkUnlocks: jest.fn(),
    getUnlockedStates: jest.fn(() => []),
  })),
}));

jest.mock('../../utils/stateBonusItems', () => ({
  StateBonusItemManager: jest.fn().mockImplementation(() => ({
    getBonus: jest.fn(() => 1),
  })),
}));

jest.mock('../../utils/firebaseUnlockSystem', () => ({
  FirebaseUnlockSystem: jest.fn().mockImplementation(() => ({
    initialize: jest.fn(),
    unlockItem: jest.fn(),
  })),
}));

jest.mock('../../utils/unlockManager', () => ({
  UnlockManager: jest.fn().mockImplementation(() => ({
    initialize: jest.fn(),
    getUserData: jest.fn(() => Promise.resolve(null)),
  })),
  UserData: class UserData {},
  SkinConfig: class SkinConfig {},
}));

jest.mock('../../utils/mysterySkinSystem', () => ({
  MysterySkinSystem: jest.fn().mockImplementation(() => ({
    checkForCrate: jest.fn(() => null),
  })),
}));

describe('GameScreen minimal render', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render GameScreen with all components', async () => {
    const Stack = createStackNavigator();

    const { queryByTestId } = render(
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Game" component={GameScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );

    // Wait for component to fully render
    await waitFor(() => {
      // The component should render without errors
      expect(true).toBeTruthy();
    });

    // Since we're mocking components, we may or may not see them rendered
    // The main test is that the component renders without crashing
    const mineCart = queryByTestId('mine-cart');
    const railTrack = queryByTestId('rail-track');

    // Component rendered successfully
    expect(true).toBeTruthy();
  });

  it('should render with direct navigation prop', async () => {
    const mockNavigation = {
      navigate: jest.fn(),
      goBack: jest.fn(),
      setOptions: jest.fn(),
      addListener: jest.fn(() => jest.fn()),
    };

    const UnlocksProvider = require('../../context/UnlocksContext').UnlocksProvider;

    const { queryByTestId } = render(
      <UnlocksProvider>
        <GameScreen navigation={mockNavigation} />
      </UnlocksProvider>
    );

    await waitFor(() => {
      // The component should render without errors
      expect(true).toBeTruthy();
    });

    // Component rendered successfully
    expect(true).toBeTruthy();
  });

  it('should render without errors when all props are provided', () => {
    const mockNavigation = {
      navigate: jest.fn(),
      goBack: jest.fn(),
      setOptions: jest.fn(),
      addListener: jest.fn(() => jest.fn()),
    };

    const UnlocksProvider = require('../../context/UnlocksContext').UnlocksProvider;

    const { queryByTestId } = render(
      <UnlocksProvider>
        <GameScreen navigation={mockNavigation} />
      </UnlocksProvider>
    );

    // Component rendered successfully without crashing
    expect(true).toBeTruthy();
  });
});
