import { GameItem, ItemType } from '../components/GameItems';
import { Particle } from '../components/ParticleEffects';
import { gameSounds, SoundTypes } from './gameSounds';
import * as Haptics from 'expo-haptics';

interface GameState {
  score: number;
  coins: number;
  level: number;
  combo: number;
  multiplier: number;
  powerUps: {
    magnet: boolean;
    slowTime: boolean;
    doubleCoins: boolean;
  };
  statistics: {
    totalCoinsCollected: number;
    highestCombo: number;
    powerUpsCollected: number;
    mysteryCratesOpened: number;
    luckyItemsFound: number;
  };
}

export class GameController {
  private state: GameState;
  private items: GameItem[] = [];
  private particles: Particle[] = [];
  private comboTimer: NodeJS.Timeout | null = null;
  private nextItemId: number = 0;
  private nextParticleId: number = 0;
  private difficulty: number = 1;
  private isPaused: boolean = false;

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): GameState {
    return {
      score: 0,
      coins: 0,
      level: 1,
      combo: 0,
      multiplier: 1,
      powerUps: {
        magnet: false,
        slowTime: false,
        doubleCoins: false,
      },
      statistics: {
        totalCoinsCollected: 0,
        highestCombo: 0,
        powerUpsCollected: 0,
        mysteryCratesOpened: 0,
        luckyItemsFound: 0,
      },
    };
  }

  startGame() {
    this.state = this.getInitialState();
    this.items = [];
    this.particles = [];
    this.isPaused = false;
    gameSounds.playSound(SoundTypes.GAME_START);
    gameSounds.playBackgroundMusic('cheerful-game-music');
  }

  pauseGame() {
    this.isPaused = true;
    gameSounds.pauseBackgroundMusic();
  }

  resumeGame() {
    this.isPaused = false;
    gameSounds.resumeBackgroundMusic();
  }

  endGame() {
    this.isPaused = true;
    const isHighScore = this.checkHighScore();
    gameSounds.playGameOverSequence(isHighScore);
    gameSounds.stopBackgroundMusic();
  }

  spawnItem(screenWidth: number): GameItem | null {
    if (this.isPaused) return null;

    const itemType = this.selectItemType();
    const x = Math.random() * (screenWidth - 60) + 30;
    const speed = this.calculateItemSpeed(itemType);
    const value = this.calculateItemValue(itemType);

    const item: GameItem = {
      id: `item_${this.nextItemId++}`,
      type: itemType,
      x,
      y: -100,
      speed,
      collected: false,
      value,
      special: this.isSpecialItem(itemType),
    };

    this.items.push(item);
    return item;
  }

  private selectItemType(): ItemType {
    const random = Math.random();
    const level = this.state.level;

    // Adjust spawn rates based on level
    if (random < 0.4) {
      // Common coins (40%)
      return ['goldCoin', 'silverCoin', 'bronzeCoin'][Math.floor(Math.random() * 3)] as ItemType;
    } else if (random < 0.6) {
      // Lucky items (20%)
      if (level >= 3) {
        return ['horseshoe', 'fourLeafClover', 'shamrock'][Math.floor(Math.random() * 3)] as ItemType;
      }
      return 'goldCoin';
    } else if (random < 0.75) {
      // Power-ups (15%)
      if (level >= 5) {
        return ['stopwatch', 'magnet', 'multiplier'][Math.floor(Math.random() * 3)] as ItemType;
      }
      return 'silverCoin';
    } else if (random < 0.85) {
      // Mystery crates (10%)
      if (level >= 7) {
        const crateTypes: ItemType[] = ['mysteryCrateOrange', 'mysteryCrateBrown', 'mysteryCratePurple'];
        return crateTypes[Math.min(Math.floor(level / 5), 2)];
      }
      return 'goldCoin';
    } else if (random < 0.93) {
      // Gift boxes (8%)
      if (level >= 10) {
        return ['giftBoxRed', 'giftBoxOrange'][Math.floor(Math.random() * 2)] as ItemType;
      }
      return 'goldCoin';
    } else {
      // Special mine carts (7%)
      if (level >= 15) {
        const cartTypes: ItemType[] = ['cartTexas', 'cartCalifornia', 'cartFlorida', 'cartNewYork', 'cartArizona'];
        return cartTypes[Math.floor(Math.random() * cartTypes.length)];
      }
      return 'goldCoin';
    }
  }

  private calculateItemSpeed(itemType: ItemType): number {
    const baseSpeed = 100 + (this.state.level * 10);
    
    // Apply slow time power-up
    const slowMultiplier = this.state.powerUps.slowTime ? 0.5 : 1;
    
    // Different speeds for different items
    switch (itemType) {
      case 'goldCoin':
      case 'silverCoin':
      case 'bronzeCoin':
        return baseSpeed * slowMultiplier;
      case 'horseshoe':
      case 'fourLeafClover':
      case 'shamrock':
        return (baseSpeed * 0.8) * slowMultiplier;
      case 'mysteryCrateOrange':
      case 'mysteryCrateBrown':
      case 'mysteryCratePurple':
        return (baseSpeed * 0.7) * slowMultiplier;
      case 'giftBoxRed':
      case 'giftBoxOrange':
        return (baseSpeed * 0.75) * slowMultiplier;
      default:
        return (baseSpeed * 0.9) * slowMultiplier;
    }
  }

  private calculateItemValue(itemType: ItemType): number {
    const baseValues: Partial<Record<ItemType, number>> = {
      goldCoin: 10,
      silverCoin: 5,
      bronzeCoin: 2,
      horseshoe: 25,
      fourLeafClover: 30,
      shamrock: 20,
      mysteryCrateOrange: 50,
      mysteryCrateBrown: 75,
      mysteryCratePurple: 100,
      giftBoxRed: 60,
      giftBoxOrange: 40,
      stopwatch: 0,
      magnet: 0,
      multiplier: 0,
      cartTexas: 200,
      cartCalifornia: 200,
      cartFlorida: 200,
    };

    const baseValue = baseValues[itemType] || 10;
    const multiplier = this.state.powerUps.doubleCoins ? 2 : 1;
    return baseValue * this.state.multiplier * multiplier;
  }

  private isSpecialItem(itemType: ItemType): boolean {
    return itemType.includes('mystery') || 
           itemType.includes('gift') || 
           itemType.includes('cart') ||
           itemType === 'fourLeafClover';
  }

  collectItem(item: GameItem): void {
    if (item.collected || this.isPaused) return;

    item.collected = true;
    
    // Update game state
    this.state.score += item.value;
    
    // Handle specific item types
    this.handleItemCollection(item);
    
    // Update combo
    this.updateCombo();
    
    // Play sound effect
    gameSounds.playItemCollectionSound(item.type, this.state.combo);
    
    // Create particle effects
    this.createCollectionParticles(item);
    
    // Haptic feedback
    if (item.special) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  private handleItemCollection(item: GameItem) {
    switch (item.type) {
      case 'goldCoin':
      case 'silverCoin':
      case 'bronzeCoin':
        this.state.coins += item.value;
        this.state.statistics.totalCoinsCollected++;
        break;
        
      case 'horseshoe':
      case 'fourLeafClover':
      case 'shamrock':
        this.state.statistics.luckyItemsFound++;
        this.state.multiplier = Math.min(this.state.multiplier + 1, 10);
        setTimeout(() => {
          this.state.multiplier = Math.max(this.state.multiplier - 1, 1);
        }, 10000);
        break;
        
      case 'stopwatch':
        this.activatePowerUp('slowTime', 10000);
        break;
        
      case 'magnet':
        this.activatePowerUp('magnet', 15000);
        break;
        
      case 'multiplier':
        this.state.multiplier = Math.min(this.state.multiplier * 2, 10);
        setTimeout(() => {
          this.state.multiplier = Math.max(this.state.multiplier / 2, 1);
        }, 8000);
        break;
        
      case 'mysteryCrateOrange':
      case 'mysteryCrateBrown':
      case 'mysteryCratePurple':
        this.state.statistics.mysteryCratesOpened++;
        this.openMysteryCrate(item.type);
        break;
        
      case 'giftBoxRed':
      case 'giftBoxOrange':
        this.openGiftBox(item.type);
        break;
        
      default:
        if (item.type.startsWith('cart')) {
          // Special cart collection - big bonus
          this.state.score += item.value;
          gameSounds.playVictorySequence();
        }
    }
  }

  private activatePowerUp(type: 'magnet' | 'slowTime' | 'doubleCoins', duration: number) {
    this.state.powerUps[type] = true;
    this.state.statistics.powerUpsCollected++;
    gameSounds.playPowerUpSequence(type);
    
    setTimeout(() => {
      this.state.powerUps[type] = false;
    }, duration);
  }

  private openMysteryCrate(crateType: string) {
    const rewards = {
      mysteryCrateOrange: { coins: 50, particles: 5 },
      mysteryCrateBrown: { coins: 100, particles: 8 },
      mysteryCratePurple: { coins: 200, particles: 12 },
    };
    
    const reward = rewards[crateType as keyof typeof rewards];
    if (reward) {
      this.state.coins += reward.coins;
      // Create explosion of particles
      for (let i = 0; i < reward.particles; i++) {
        this.createParticle('star', 0, 0);
      }
    }
  }

  private openGiftBox(boxType: string) {
    const random = Math.random();
    if (random < 0.3) {
      // Power-up
      const powerUps = ['magnet', 'slowTime', 'doubleCoins'] as const;
      this.activatePowerUp(powerUps[Math.floor(Math.random() * 3)], 20000);
    } else if (random < 0.7) {
      // Coins
      const coins = boxType === 'giftBoxRed' ? 100 : 75;
      this.state.coins += coins;
    } else {
      // Multiplier boost
      this.state.multiplier = Math.min(this.state.multiplier + 2, 10);
    }
  }

  private updateCombo() {
    this.state.combo++;
    
    if (this.state.combo > this.state.statistics.highestCombo) {
      this.state.statistics.highestCombo = this.state.combo;
    }
    
    // Reset combo timer
    if (this.comboTimer) {
      clearTimeout(this.comboTimer);
    }
    
    this.comboTimer = setTimeout(() => {
      this.state.combo = 0;
    }, 2000);
  }

  private createCollectionParticles(item: GameItem) {
    const particleCount = item.special ? 8 : 4;
    const particleTypes: Array<Particle['type']> = 
      item.type.includes('coin') ? ['coin', 'star'] :
      item.type.includes('lucky') ? ['shamrock', 'star'] :
      item.type.includes('gift') ? ['heart', 'confetti'] :
      ['sparkle', 'star'];
    
    for (let i = 0; i < particleCount; i++) {
      const type = particleTypes[Math.floor(Math.random() * particleTypes.length)];
      this.createParticle(type, item.x, item.y);
    }
  }

  createParticle(type: Particle['type'], x: number, y: number): Particle {
    const particle: Particle = {
      id: `particle_${this.nextParticleId++}`,
      type,
      x,
      y,
      size: type === 'confetti' ? 20 : 30,
    };
    
    this.particles.push(particle);
    return particle;
  }

  updateLevel() {
    const newLevel = Math.floor(this.state.score / 1000) + 1;
    if (newLevel > this.state.level) {
      this.state.level = newLevel;
      gameSounds.playSound(SoundTypes.LEVEL_UP);
      // Create celebration particles
      for (let i = 0; i < 20; i++) {
        this.createParticle('confetti', Math.random() * 400, Math.random() * 200);
      }
    }
  }

  private checkHighScore(): boolean {
    // In a real app, this would check against saved high score
    return this.state.score > 10000;
  }

  getState(): GameState {
    return { ...this.state };
  }

  getItems(): GameItem[] {
    return this.items.filter(item => !item.collected);
  }

  getParticles(): Particle[] {
    return [...this.particles];
  }

  removeParticle(id: string) {
    this.particles = this.particles.filter(p => p.id !== id);
  }

  cleanup() {
    this.items = [];
    this.particles = [];
    if (this.comboTimer) {
      clearTimeout(this.comboTimer);
    }
    gameSounds.cleanup();
  }
}

export const gameController = new GameController();