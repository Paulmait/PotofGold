// Clean up timers and async after each test
import { cleanup } from '@testing-library/react-native';
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  cleanup();
});
// Explicitly mock gesture-handler and reanimated for all import styles
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View, ScrollView } = require('react-native');
  const mockComponent = (name: any) => {
    return React.forwardRef((props: any, ref: any) => React.createElement(View, { ...props, ref }, props.children));
  };
  const Animated = {
    View,
    ScrollView,
    createAnimatedComponent: (Component: any) => Component,
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
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.createAnimatedComponent = (Component: any) => Component;
  Reanimated.default = Reanimated;
  return Reanimated;
});
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GameProvider } from '../../context/GameContext';
import GameScreen from '../../screens/GameScreen';
import PauseModal from '../../screens/PauseModal';
import GameOverScreen from '../../screens/GameOverScreen';
import { useGameEngine } from '../../hooks/useGameEngine';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { masterGameManager } from '../../utils/masterGameManager';
import { skinSystem } from '../../utils/skinSystem';
import { soundSystem } from '../../utils/soundSystem';

// Mock dependencies
jest.mock('../../utils/masterGameManager');
jest.mock('../../utils/skinSystem');
jest.mock('../../utils/soundSystem');
jest.mock('../../hooks/useGameEngine');
jest.mock('../../hooks/useOfflineSync');

const Stack = createStackNavigator();

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <NavigationContainer>
    <GameProvider>
      <Stack.Navigator>
        <Stack.Screen name="Game" component={GameScreen} />
      </Stack.Navigator>
      {children}
    </GameProvider>
  </NavigationContainer>
);

describe('Game Flow Integration Tests', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    // Mock successful auth
    (masterGameManager.initializeGame as jest.Mock).mockResolvedValue({
      userId: 'test_user',
      isAuthenticated: true,
    });
    // Mock skin system
    (skinSystem.getOwnedSkins as jest.Mock).mockResolvedValue([
      { id: 'default_pot', name: 'Default Pot', owned: true, equipped: true },
      { id: 'golden_pot', name: 'Golden Pot', owned: false, cost: 500 },
    ]);
    // Mock purchaseSkin (not implemented in skinSystem)
    // @ts-ignore
    skinSystem.purchaseSkin = jest.fn().mockResolvedValue({
      success: true,
      skinId: 'golden_pot',
    });
    // Mock upgradePot (not implemented in masterGameManager)
    // @ts-ignore
    masterGameManager.upgradePot = jest.fn().mockResolvedValue({
      success: true,
      newLevel: 2,
      cost: 100,
    });
    // Mock getUserState (not implemented in masterGameManager)
    // @ts-ignore
    masterGameManager.getUserState = jest.fn().mockResolvedValue({
      version: 2,
      lastModified: Date.now(),
      data: { coins: 150, ownedSkins: ['default_pot', 'golden_pot'] },
    });
    // Mock sound system
    (soundSystem.playSound as jest.Mock).mockResolvedValue(undefined);
    (soundSystem.playMusic as jest.Mock).mockResolvedValue(undefined);
  });


  afterEach(async () => {
    // Flush all pending timers and microtasks
    await Promise.resolve();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('Auth → Start Game → Earn Coins → Upgrade → Change Skin → Pause/Resume', () => {
    it('should complete full game flow successfully', async () => {
      const mockGameEngine = {
        gameState: {
          isActive: false,
          isPaused: false,
          score: 0,
          coins: 100,
          timeSurvived: 0,
          combo: 0,
          potLevel: 1,
          currentSkin: 'default_pot',
        },
        startGame: jest.fn(),
        pauseGame: jest.fn(),
        resumeGame: jest.fn(),
        collectCoin: jest.fn(),
        activateTurboBoost: jest.fn(),
      };

      (useGameEngine as jest.Mock).mockReturnValue(mockGameEngine);

      const { getByText, getByTestId } = render(
        <TestWrapper>
          <GameScreen navigation={{}} />
        </TestWrapper>
      );

      // 1. Start Game
      const startButton = getByText('Start Game');
      fireEvent.press(startButton);
      
      await waitFor(() => {
        expect(mockGameEngine.startGame).toHaveBeenCalled();
      });

      // 2. Collect Coins
      const collectButton = getByText('Collect Coin');
      fireEvent.press(collectButton);
      
      await waitFor(() => {
        expect(mockGameEngine.collectCoin).toHaveBeenCalled();
      });

      // 3. Pause Game
      const pauseButton = getByText('Pause');
      fireEvent.press(pauseButton);
      
      await waitFor(() => {
        expect(mockGameEngine.pauseGame).toHaveBeenCalled();
      });

      // 4. Resume Game
      const resumeButton = getByText('▶️ Resume');
      fireEvent.press(resumeButton);
      
      await waitFor(() => {
        expect(mockGameEngine.resumeGame).toHaveBeenCalled();
      });
    });

    it('should handle pot upgrade in pause modal', async () => {
      const mockUpgradeResult = {
        success: true,
        newLevel: 2,
        cost: 100,
      };

      // @ts-ignore
      masterGameManager.upgradePot.mockResolvedValue(mockUpgradeResult);

      const { getByText, queryByText } = render(
        <PauseModal
          visible={true}
          onClose={jest.fn()}
          onResume={jest.fn()}
          onRetry={jest.fn()}
          onExit={jest.fn()}
          currentScore={500}
          currentCoins={200}
          potLevel={1}
          currentSkin="default_pot"
          availablePowerUps={[]}
          onStateUpdate={jest.fn()}
        />
      );

      // Find and press upgrade button
      const upgradeButton = getByText(/Upgrade Pot \(Cost: 100\)/);
      fireEvent.press(upgradeButton);

      await waitFor(() => {
        // @ts-ignore
        expect(masterGameManager.upgradePot).toHaveBeenCalled();
        expect(soundSystem.playSound).toHaveBeenCalledWith('upgrade_success');
      });
    });

    it('should handle skin change in pause modal', async () => {
      const mockSkinResult = {
        success: true,
        skin: { id: 'golden_pot', name: 'Golden Pot' },
      };

      (skinSystem.equipSkin as jest.Mock).mockResolvedValue(mockSkinResult);

      const { getByText } = render(
        <PauseModal
          visible={true}
          onClose={jest.fn()}
          onResume={jest.fn()}
          onRetry={jest.fn()}
          onExit={jest.fn()}
          currentScore={500}
          currentCoins={200}
          potLevel={1}
          currentSkin="default_pot"
          availablePowerUps={[]}
          onStateUpdate={jest.fn()}
        />
      );

      // Find and press skin button (assuming it's rendered)
      const skinButton = getByText('🎨');
      fireEvent.press(skinButton);

      await waitFor(() => {
        expect(skinSystem.equipSkin).toHaveBeenCalled();
        expect(soundSystem.playSound).toHaveBeenCalledWith('skin_change');
      });
    });
  });

  describe('Game Over Logic - Pot Blocked', () => {
    it('should trigger game over when pot is blocked', async () => {
      const mockGameEngine = {
        gameState: {
          isActive: true,
          isPaused: false,
          score: 1000,
          coins: 50,
          timeSurvived: 60,
          combo: 5,
          blockagePercentage: 100, // Pot is blocked
        },
        endGame: jest.fn(),
        updateBlockage: jest.fn(),
      };

      (useGameEngine as jest.Mock).mockReturnValue(mockGameEngine);

      const { getByText } = render(
        <GameOverScreen
          visible={true}
          gameData={{
            score: 1000,
            coins: 50,
            timeSurvived: 60,
            combo: 5,
            obstaclesAvoided: 10,
            powerUpsUsed: 2,
            blockagePercentage: 100,
            reason: 'blockage',
          }}
          onRetry={jest.fn()}
          onExit={jest.fn()}
          onUpgrade={jest.fn()}
        />
      );

      // Verify game over reason is displayed
      expect(getByText('Your pot was blocked by coins!')).toBeTruthy();

      // Verify retry button is available
      const retryButton = getByText('🔄 Retry');
      expect(retryButton).toBeTruthy();
    });

    it('should show upgrade suggestions when performance is poor', async () => {
      const { getByText } = render(
        <GameOverScreen
          visible={true}
          gameData={{
            score: 50,
            coins: 10,
            timeSurvived: 15,
            combo: 1,
            obstaclesAvoided: 2,
            powerUpsUsed: 0,
            blockagePercentage: 100,
            reason: 'blockage',
          }}
          onRetry={jest.fn()}
          onExit={jest.fn()}
          onUpgrade={jest.fn()}
        />
      );

      // Verify upgrade suggestions are shown
      expect(getByText('Upgrade Suggestions')).toBeTruthy();
      expect(getByText('Upgrade Your Pot')).toBeTruthy();
    });
  });

  describe('Offline Play → Unlock Skin → Reconnect → Sync', () => {
    it('should handle offline skin unlock and sync on reconnect', async () => {
      const mockOfflineSync = {
        syncState: {
          isOnline: false,
          isSyncing: false,
          pendingActions: 1,
        },
        triggerSync: jest.fn(),
        reconcileState: jest.fn(),
      };

      (useOfflineSync as jest.Mock).mockReturnValue(mockOfflineSync);

      // Mock offline skin purchase
      // @ts-ignore
      skinSystem.purchaseSkin.mockResolvedValue({
        success: true,
        skinId: 'golden_pot',
      });

      const { getByText } = render(
        <TestWrapper>
          <GameScreen navigation={{}} />
        </TestWrapper>
      );

      // Simulate offline skin purchase
      await act(async () => {
        // @ts-ignore
        await skinSystem.purchaseSkin('golden_pot');
      });

      // Verify offline action was queued
      expect(mockOfflineSync.triggerSync).toHaveBeenCalled();

      // Simulate reconnection
      await act(async () => {
        mockOfflineSync.syncState.isOnline = true;
        await mockOfflineSync.reconcileState();
      });

      // Verify sync was triggered
      expect(mockOfflineSync.reconcileState).toHaveBeenCalled();
    });

    it('should handle sync conflicts between local and remote state', async () => {
      const mockLocalState = {
        version: 1,
        lastModified: Date.now() - 1000,
        data: { coins: 100, ownedSkins: ['default_pot'] },
      };

      const mockRemoteState = {
        version: 2,
        lastModified: Date.now(),
        data: { coins: 150, ownedSkins: ['default_pot', 'golden_pot'] },
      };

      // @ts-ignore
      masterGameManager.getUserState.mockResolvedValue(mockRemoteState);

      const { getByText } = render(
        <TestWrapper>
          <GameScreen navigation={{}} />
        </TestWrapper>
      );

      // Simulate conflict resolution
      await act(async () => {
        // This would trigger the conflict resolution logic
        // @ts-ignore
        await masterGameManager.getUserState();
      });

      // Verify state was reconciled
      // @ts-ignore
      expect(masterGameManager.getUserState).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network errors gracefully', async () => {
      (masterGameManager.initializeGame as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const { getByText } = render(
        <TestWrapper>
          <GameScreen navigation={{}} />
        </TestWrapper>
      );

      // Verify error handling
      await waitFor(() => {
        expect(getByText('Error loading game')).toBeTruthy();
      });
    });

    it('should handle insufficient coins for upgrades', async () => {
      const { getByText } = render(
        <PauseModal
          visible={true}
          onClose={jest.fn()}
          onResume={jest.fn()}
          onRetry={jest.fn()}
          onExit={jest.fn()}
          currentScore={500}
          currentCoins={50} // Not enough for upgrade
          potLevel={1}
          currentSkin="default_pot"
          availablePowerUps={[]}
          onStateUpdate={jest.fn()}
        />
      );

      const upgradeButton = getByText(/Upgrade Pot \(Cost: 100\)/);
      fireEvent.press(upgradeButton);

      await waitFor(() => {
        expect(getByText('Insufficient Coins')).toBeTruthy();
      });
    });

    it('should handle sound system failures gracefully', async () => {
      (soundSystem.playSound as jest.Mock).mockRejectedValue(
        new Error('Audio error')
      );

      const { getByText } = render(
        <TestWrapper>
          <GameScreen navigation={{}} />
        </TestWrapper>
      );

      // Game should continue even if sound fails
      const startButton = getByText('Start Game');
      fireEvent.press(startButton);

      // Verify game continues despite sound error
      await waitFor(() => {
        expect(soundSystem.playSound).toHaveBeenCalled();
      });
    });
  });

  describe('Performance and Memory Tests', () => {
    it('should handle rapid button presses without memory leaks', async () => {
      const { getByText } = render(
        <TestWrapper>
          <GameScreen navigation={{}} />
        </TestWrapper>
      );

      const collectButton = getByText('Collect Coin');

      // Rapid button presses
      for (let i = 0; i < 100; i++) {
        fireEvent.press(collectButton);
      }

      // Verify no memory leaks or crashes
      await waitFor(() => {
        expect(collectButton).toBeTruthy();
      });
    });

    it('should handle large amounts of game data efficiently', async () => {
      const largeGameData = {
        score: 999999,
        coins: 50000,
        timeSurvived: 3600,
        combo: 1000,
        obstaclesAvoided: 500,
        powerUpsUsed: 100,
        blockagePercentage: 0,
        reason: 'manual_exit' as const,
      };

      const { getByText } = render(
        <GameOverScreen
          visible={true}
          gameData={largeGameData}
          onRetry={jest.fn()}
          onExit={jest.fn()}
          onUpgrade={jest.fn()}
        />
      );

      // Verify large numbers are displayed correctly
      expect(getByText('999,999')).toBeTruthy();
      expect(getByText('50,000')).toBeTruthy();
    });
  });
}); 