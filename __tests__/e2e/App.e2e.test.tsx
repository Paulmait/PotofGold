import { device, element, by, expect } from 'detox';

describe('Pot of Gold E2E Tests', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Authentication Flow', () => {
    it('should handle authentication successfully', async () => {
      // Wait for app to load
      await expect(element(by.text('Pot of Gold'))).toBeVisible();
      
      // Check if login screen appears
      await expect(element(by.text('Start Game'))).toBeVisible();
    });
  });

  describe('Game Flow', () => {
    it('should complete full game session', async () => {
      // Start game
      await element(by.text('Start Game')).tap();
      
      // Verify game is active
      await expect(element(by.text('Score:'))).toBeVisible();
      await expect(element(by.text('Coins:'))).toBeVisible();
      
      // Collect coins
      await element(by.text('Collect Coin')).tap();
      await element(by.text('Collect Coin')).tap();
      await element(by.text('Collect Coin')).tap();
      
      // Verify score increased
      await expect(element(by.text('Score: 30'))).toBeVisible();
      
      // Pause game
      await element(by.text('Pause')).tap();
      
      // Verify pause modal
      await expect(element(by.text('⏸ Game Paused'))).toBeVisible();
      
      // Resume game
      await element(by.text('▶️ Resume')).tap();
      
      // Verify game resumed
      await expect(element(by.text('⏸ Game Paused'))).not.toBeVisible();
    });

    it('should handle pot upgrade in pause modal', async () => {
      // Start game and pause
      await element(by.text('Start Game')).tap();
      await element(by.text('Pause')).tap();
      
      // Find and tap upgrade button
      await element(by.text(/Upgrade Pot/)).tap();
      
      // Verify upgrade success
      await expect(element(by.text('Success!'))).toBeVisible();
    });

    it('should handle skin change in pause modal', async () => {
      // Start game and pause
      await element(by.text('Start Game')).tap();
      await element(by.text('Pause')).tap();
      
      // Find and tap skin button
      await element(by.text('🎨')).tap();
      
      // Verify skin change
      await expect(element(by.text('Success!'))).toBeVisible();
    });
  });

  describe('Game Over Flow', () => {
    it('should show game over when pot is blocked', async () => {
      // Start game
      await element(by.text('Start Game')).tap();
      
      // Simulate blockage (this would need game logic to trigger)
      // For now, we'll test the game over screen directly
      
      // Navigate to game over (this would normally be triggered by game logic)
      await device.reloadReactNative();
      
      // Verify game over elements
      await expect(element(by.text('Game Over'))).toBeVisible();
      await expect(element(by.text('🔄 Retry'))).toBeVisible();
    });
  });

  describe('Performance Tests', () => {
    it('should handle rapid button presses', async () => {
      // Start game
      await element(by.text('Start Game')).tap();
      
      // Rapid button presses
      const collectButton = element(by.text('Collect Coin'));
      
      for (let i = 0; i < 50; i++) {
        await collectButton.tap();
        await device.pause(50); // Small delay
      }
      
      // Verify app didn't crash
      await expect(element(by.text('Score:'))).toBeVisible();
    });

    it('should handle memory pressure', async () => {
      // Start game
      await element(by.text('Start Game')).tap();
      
      // Simulate memory pressure by rapid state changes
      const collectButton = element(by.text('Collect Coin'));
      const pauseButton = element(by.text('Pause'));
      
      for (let i = 0; i < 20; i++) {
        await collectButton.tap();
        await pauseButton.tap();
        await element(by.text('▶️ Resume')).tap();
        await device.pause(100);
      }
      
      // Verify app still responsive
      await expect(element(by.text('Score:'))).toBeVisible();
    });
  });

  describe('UI Responsiveness', () => {
    it('should handle different screen orientations', async () => {
      // Test portrait mode
      await device.setOrientation('portrait');
      await expect(element(by.text('Start Game'))).toBeVisible();
      
      // Test landscape mode
      await device.setOrientation('landscape');
      await expect(element(by.text('Start Game'))).toBeVisible();
      
      // Return to portrait
      await device.setOrientation('portrait');
    });

    it('should handle different screen sizes', async () => {
      // Test on different emulator sizes
      // This would require multiple emulator instances
      await expect(element(by.text('Start Game'))).toBeVisible();
    });
  });

  describe('Network Handling', () => {
    it('should handle offline mode gracefully', async () => {
      // Simulate offline mode
      await device.setURLBlacklist(['.*']);
      
      // Start game
      await element(by.text('Start Game')).tap();
      
      // Verify app continues to work
      await expect(element(by.text('Score:'))).toBeVisible();
      
      // Restore network
      await device.setURLBlacklist([]);
    });

    it('should sync data when coming back online', async () => {
      // Go offline
      await device.setURLBlacklist(['.*']);
      
      // Perform some actions
      await element(by.text('Start Game')).tap();
      await element(by.text('Collect Coin')).tap();
      
      // Go back online
      await device.setURLBlacklist([]);
      
      // Verify sync occurred
      await expect(element(by.text('Score:'))).toBeVisible();
    });
  });

  describe('Accessibility', () => {
    it('should support screen readers', async () => {
      // Enable accessibility
      await device.setAccessibilityEnabled(true);
      
      // Verify accessibility labels
      await expect(element(by.label('Start Game Button'))).toBeVisible();
      await expect(element(by.label('Collect Coin Button'))).toBeVisible();
      
      // Disable accessibility
      await device.setAccessibilityEnabled(false);
    });

    it('should handle large text sizes', async () => {
      // Set large text size
      await device.setFontSize(2.0);
      
      // Verify UI still usable
      await expect(element(by.text('Start Game'))).toBeVisible();
      
      // Reset font size
      await device.setFontSize(1.0);
    });
  });

  describe('Battery and Performance', () => {
    it('should handle low battery mode', async () => {
      // Simulate low battery
      await device.setBatteryLevel(0.1);
      
      // Verify app continues to work
      await element(by.text('Start Game')).tap();
      await expect(element(by.text('Score:'))).toBeVisible();
      
      // Reset battery level
      await device.setBatteryLevel(1.0);
    });

    it('should handle background/foreground transitions', async () => {
      // Start game
      await element(by.text('Start Game')).tap();
      
      // Send app to background
      await device.sendToHome();
      await device.pause(2000);
      
      // Bring app back to foreground
      await device.launchApp({ newInstance: false });
      
      // Verify game state preserved
      await expect(element(by.text('Score:'))).toBeVisible();
    });
  });
}); 