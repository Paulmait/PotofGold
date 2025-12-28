import { useEffect, useState, useCallback } from 'react';
import { useUnlocks } from '../context/UnlocksContext';
import { gameSounds } from '../utils/gameSounds';
import * as Haptics from 'expo-haptics';

// Game integration hook for unlocks
export const useGameUnlocks = () => {
  const unlocks = useUnlocks();
  const [currentCartSkin, setCurrentCartSkin] = useState(unlocks.getEquippedCartSkin());
  const [currentTrail, setCurrentTrail] = useState(unlocks.getEquippedTrail());
  const [unlockedStates, setUnlockedStates] = useState(unlocks.unlocks?.stateFlags || []);

  // Update local state when unlocks change
  useEffect(() => {
    if (unlocks.unlocks) {
      setCurrentCartSkin(unlocks.getEquippedCartSkin());
      setCurrentTrail(unlocks.getEquippedTrail());
      setUnlockedStates(unlocks.unlocks.stateFlags);
    }
  }, [unlocks.unlocks]);

  // Check if item should spawn based on unlocks
  const canSpawnItem = useCallback(
    (itemType: string): boolean => {
      if (!unlocks.unlocks) return false;

      // Check if state-specific items are unlocked
      if (itemType.startsWith('cart')) {
        const stateId = itemType.replace('cart', '').toLowerCase();
        const stateFlag = unlocks.getStateFlag(stateId);
        return stateFlag !== undefined && stateFlag.progress >= 50;
      }

      // All other items can spawn by default
      return true;
    },
    [unlocks.unlocks]
  );

  // Apply trail effect when collecting items
  const applyTrailEffect = useCallback(
    (x: number, y: number) => {
      if (!currentTrail) return null;

      return {
        type: currentTrail.particleType,
        color: currentTrail.color,
        effect: currentTrail.effect,
        position: { x, y },
      };
    },
    [currentTrail]
  );

  // Get cart skin visuals
  const getCartVisuals = useCallback(() => {
    if (!currentCartSkin) {
      return {
        skinId: 'default',
        colors: ['#8B4513', '#654321'],
        icon: '🛒',
      };
    }

    const skinVisuals: Record<string, any> = {
      texas: {
        colors: ['#002868', '#BF0A30'],
        icon: '⭐',
      },
      california: {
        colors: ['#FFD700', '#FF6347'],
        icon: '🐻',
      },
      florida: {
        colors: ['#FFA500', '#00CED1'],
        icon: '🌴',
      },
      newyork: {
        colors: ['#002D62', '#FF6319'],
        icon: '🗽',
      },
      arizona: {
        colors: ['#CE1126', '#FFC72C'],
        icon: '🌵',
      },
      default: {
        colors: ['#8B4513', '#654321'],
        icon: '🛒',
      },
    };

    return {
      skinId: currentCartSkin.id,
      ...(skinVisuals[currentCartSkin.id] || skinVisuals.default),
    };
  }, [currentCartSkin]);

  // Unlock new item with celebration
  const celebrateUnlock = useCallback(
    async (type: 'skin' | 'trail' | 'state' | 'achievement', itemId: string) => {
      // Play celebration sounds
      gameSounds.playSound('achievement');

      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Create celebration particles
      const particleCount = type === 'state' ? 20 : 10;
      const particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          type: 'confetti',
          delay: i * 50,
        });
      }

      return particles;
    },
    []
  );

  // Check and unlock achievements based on game progress
  const checkAchievements = useCallback(
    async (gameStats: any) => {
      if (!unlocks.unlocks) return;

      const achievements = [];

      // First coin collected
      if (gameStats.totalCoins === 1 && !hasAchievement('first_coin')) {
        await unlocks.unlockAchievement('first_coin', {
          type: 'coins',
          value: 10,
        });
        achievements.push('first_coin');
      }

      // Collected 100 coins
      if (gameStats.totalCoins >= 100 && !hasAchievement('coin_collector')) {
        await unlocks.unlockAchievement('coin_collector', {
          type: 'skin',
          value: 'golden_cart',
        });
        achievements.push('coin_collector');
      }

      // Unlocked 5 states
      if (unlockedStates.length >= 5 && !hasAchievement('explorer')) {
        await unlocks.unlockAchievement('explorer', {
          type: 'trail',
          value: 'rainbow',
        });
        achievements.push('explorer');
      }

      // High combo
      if (gameStats.highestCombo >= 10 && !hasAchievement('combo_master')) {
        await unlocks.unlockAchievement('combo_master', {
          type: 'gems',
          value: 50,
        });
        achievements.push('combo_master');
      }

      return achievements;
    },
    [unlocks, unlockedStates]
  );

  const hasAchievement = (achievementId: string): boolean => {
    return unlocks.unlocks?.achievements.some((a) => a.id === achievementId) || false;
  };

  // Progress state unlock
  const progressStateUnlock = useCallback(
    async (stateId: string, points: number) => {
      const state = unlocks.getStateFlag(stateId);

      if (!state) {
        // First time discovering this state
        await unlocks.unlockStateFlag(stateId);
        await celebrateUnlock('state', stateId);
        return { unlocked: true, progress: 0 };
      }

      // Update progress
      const newProgress = Math.min(100, state.progress + points);
      await unlocks.updateStateProgress(stateId, newProgress);

      // Check if fully unlocked (100%)
      if (state.progress < 100 && newProgress >= 100) {
        await celebrateUnlock('state', stateId);

        // Grant state completion rewards
        return {
          completed: true,
          rewards: state.rewards,
        };
      }

      return { progress: newProgress };
    },
    [unlocks, celebrateUnlock]
  );

  // Get power-up effectiveness based on upgrades
  const getPowerUpMultiplier = useCallback(
    (powerUpId: string): number => {
      const powerUp = unlocks.unlocks?.powerUps.find((p) => p.id === powerUpId);
      if (!powerUp) return 1;

      // Each level adds 20% effectiveness
      return 1 + (powerUp.level - 1) * 0.2;
    },
    [unlocks.unlocks]
  );

  // Check if player can afford unlock
  const canAffordUnlock = useCallback(
    (
      cost: { coins?: number; gems?: number },
      playerResources: { coins: number; gems: number }
    ): boolean => {
      if (cost.coins && playerResources.coins < cost.coins) return false;
      if (cost.gems && playerResources.gems < cost.gems) return false;
      return true;
    },
    []
  );

  // Get unlock requirements
  const getUnlockRequirements = useCallback((type: string, id: string) => {
    const requirements: Record<string, any> = {
      // Cart skins
      skin_texas: { coins: 500, level: 5 },
      skin_california: { coins: 750, level: 8 },
      skin_florida: { coins: 600, level: 6 },
      skin_newyork: { coins: 1000, level: 10 },
      skin_arizona: { coins: 650, level: 7 },

      // Trails
      trail_rainbow: { gems: 50, achievements: 3 },
      trail_fire: { coins: 1500, level: 15 },
      trail_ice: { gems: 75, states: 10 },
      trail_golden: { coins: 2000, level: 20 },

      // Power-up upgrades
      upgrade_magnet: { coins: 200 * (getPowerUpLevel('magnet') + 1) },
      upgrade_slowtime: { coins: 250 * (getPowerUpLevel('slowtime') + 1) },
      upgrade_multiplier: { gems: 25 * (getPowerUpLevel('multiplier') + 1) },
    };

    return requirements[`${type}_${id}`] || { coins: 100 };
  }, []);

  const getPowerUpLevel = (powerUpId: string): number => {
    return unlocks.unlocks?.powerUps.find((p) => p.id === powerUpId)?.level || 0;
  };

  return {
    // Current equipment
    currentCartSkin,
    currentTrail,
    unlockedStates,

    // Methods
    canSpawnItem,
    applyTrailEffect,
    getCartVisuals,
    celebrateUnlock,
    checkAchievements,
    progressStateUnlock,
    getPowerUpMultiplier,
    canAffordUnlock,
    getUnlockRequirements,

    // Direct access to context methods
    equipCartSkin: unlocks.equipCartSkin,
    equipTrail: unlocks.equipTrail,
    unlockCartSkin: unlocks.unlockCartSkin,
    unlockTrail: unlocks.unlockTrail,
    upgradePowerUp: unlocks.upgradePowerUp,

    // Stats
    totalUnlocks: unlocks.getTotalUnlocksCount(),
    isLoading: unlocks.loading,
    error: unlocks.error,
  };
};
