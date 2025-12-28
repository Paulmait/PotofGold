import { GameEngine, GameObject } from './GameEngine';
import { Cart } from './objects/Cart';
import { FallingItem } from './objects/FallingItem';
import { Background } from './objects/Background';
import { RailTrack } from './objects/RailTrack';
import { ParticleSystem } from './effects/ParticleSystem';
import { SoundManager } from './audio/SoundManager';
import { GameUI } from './ui/GameUI';

export interface GameState {
  score: number;
  coins: number;
  stars: number;
  hearts: number;
  level: number;
  combo: number;
  highScore: number;
  isPaused: boolean;
  isGameOver: boolean;
}

export class PotOfGoldGame {
  private engine: GameEngine;
  private canvas: HTMLCanvasElement;
  private state: GameState;

  // Game objects
  private cart: Cart;
  private background: Background;
  private railTrack: RailTrack;
  private ui: GameUI;
  private particleSystem: ParticleSystem;
  private soundManager: SoundManager;

  // Game mechanics
  private spawnTimer: number = 0;
  private spawnInterval: number = 1.0; // seconds
  private difficulty: number = 1;
  private itemSpeed: number = 200; // pixels per second

  // Responsive scaling
  private baseWidth: number = 1920;
  private baseHeight: number = 1080;
  private scale: number = 1;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error(`Canvas with id ${canvasId} not found`);
    }

    // Initialize game state
    this.state = {
      score: 0,
      coins: 0,
      stars: 0,
      hearts: 3,
      level: 1,
      combo: 0,
      highScore: parseInt(localStorage.getItem('potofgold_highscore') || '0'),
      isPaused: false,
      isGameOver: false,
    };

    // Setup responsive canvas
    this.setupResponsiveCanvas();

    // Initialize game engine
    this.engine = new GameEngine({
      canvas: this.canvas,
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      debug: false,
    });

    // Initialize game components
    this.soundManager = new SoundManager();
    this.particleSystem = new ParticleSystem(this.engine);

    // Create game objects
    this.background = new Background(this.engine);
    this.railTrack = new RailTrack(this.engine);
    this.cart = new Cart(this.engine, window.innerWidth / 2 - 40, window.innerHeight - 150);
    this.ui = new GameUI(this.engine, this.state);

    // Setup game callbacks
    this.setupGameCallbacks();

    // Setup window resize handler
    window.addEventListener('resize', this.handleResize.bind(this));

    // Start the game
    this.start();
  }

  private setupResponsiveCanvas(): void {
    // Make canvas fill the window
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.touchAction = 'none'; // Prevent scrolling on mobile
    this.canvas.style.userSelect = 'none';

    // Calculate scale factor for responsive design
    const windowAspect = window.innerWidth / window.innerHeight;
    const baseAspect = this.baseWidth / this.baseHeight;

    if (windowAspect > baseAspect) {
      // Window is wider than base aspect
      this.scale = window.innerHeight / this.baseHeight;
    } else {
      // Window is taller than base aspect
      this.scale = window.innerWidth / this.baseWidth;
    }
  }

  private setupGameCallbacks(): void {
    // Handle touch/mouse input
    this.engine.onTouch = (x: number, y: number, type: string) => {
      if (this.state.isGameOver || this.state.isPaused) return;

      if (type === 'start' || type === 'move') {
        // Move cart to touch position
        this.cart.moveTo(x);

        // Add visual feedback
        if (type === 'start') {
          this.particleSystem.createBurst(x, y, 'touch');
          this.soundManager.play('tap');
        }
      }
    };

    // Handle game updates
    this.engine.onUpdate = (deltaTime: number) => {
      if (this.state.isGameOver || this.state.isPaused) return;

      // Update spawn timer
      this.spawnTimer += deltaTime;
      if (this.spawnTimer >= this.spawnInterval) {
        this.spawnFallingItem();
        this.spawnTimer = 0;

        // Increase difficulty over time
        this.updateDifficulty();
      }

      // Check collisions
      this.checkCollisions();

      // Update UI
      this.ui.update(this.state);

      // Update particles
      this.particleSystem.update(deltaTime);
    };

    // Handle rendering
    this.engine.onRender = (ctx: CanvasRenderingContext2D) => {
      // Render additional effects
      this.particleSystem.render(ctx);

      // Render combo indicator
      if (this.state.combo > 1) {
        this.renderCombo(ctx);
      }
    };
  }

  private spawnFallingItem(): void {
    const types = ['coin', 'diamond', 'star', 'clover', 'bomb', 'heart', 'magnet', 'multiplier'];
    const weights = [40, 10, 15, 10, 15, 5, 3, 2]; // Spawn probabilities

    // Weighted random selection
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let selectedType = types[0];

    for (let i = 0; i < types.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        selectedType = types[i];
        break;
      }
    }

    // Create falling item at random x position
    const x = Math.random() * (window.innerWidth - 40);
    const item = new FallingItem(
      this.engine,
      x,
      -50,
      selectedType,
      this.itemSpeed + this.difficulty * 20
    );

    this.engine.addGameObject(item);
  }

  private checkCollisions(): void {
    const items = this.engine
      .getAllGameObjects()
      .filter((obj) => obj.type === 'item') as FallingItem[];
    const cartBounds = this.cart.getBounds();

    for (const item of items) {
      const itemBounds = item.getBounds();

      // Check if item hit the ground (missed)
      if (itemBounds.y > window.innerHeight) {
        this.handleMissedItem(item);
        this.engine.removeGameObject(item.id);
        continue;
      }

      // Check collision with cart
      if (this.checkBoundsCollision(cartBounds, itemBounds)) {
        this.handleItemCollection(item);
        this.engine.removeGameObject(item.id);
      }
    }
  }

  private checkBoundsCollision(a: any, b: any): boolean {
    return !(
      a.x + a.width < b.x ||
      b.x + b.width < a.x ||
      a.y + a.height < b.y ||
      b.y + b.height < a.y
    );
  }

  private handleItemCollection(item: FallingItem): void {
    const itemType = item.itemType;

    switch (itemType) {
      case 'coin':
        this.state.coins++;
        this.state.score += 10 * (this.state.combo + 1);
        this.state.combo++;
        this.soundManager.play('coin');
        this.particleSystem.createBurst(item.x, item.y, 'gold');
        break;

      case 'diamond':
        this.state.score += 50 * (this.state.combo + 1);
        this.state.combo++;
        this.soundManager.play('diamond');
        this.particleSystem.createBurst(item.x, item.y, 'diamond');
        break;

      case 'star':
        this.state.stars++;
        this.state.score += 25 * (this.state.combo + 1);
        this.state.combo++;
        this.soundManager.play('star');
        this.particleSystem.createBurst(item.x, item.y, 'star');
        break;

      case 'bomb':
        this.state.hearts--;
        this.state.combo = 0;
        this.soundManager.play('explosion');
        this.particleSystem.createExplosion(item.x, item.y);

        // Shake screen effect
        this.shakeScreen();

        if (this.state.hearts <= 0) {
          this.gameOver();
        }
        break;

      case 'heart':
        this.state.hearts = Math.min(this.state.hearts + 1, 5);
        this.soundManager.play('heart');
        this.particleSystem.createBurst(item.x, item.y, 'heart');
        break;

      default:
        this.state.score += 5;
        this.soundManager.play('collect');
        break;
    }

    // Update cart visual
    this.cart.collectItem(itemType);
  }

  private handleMissedItem(item: FallingItem): void {
    if (item.itemType !== 'bomb') {
      this.state.combo = 0; // Reset combo on miss
    }
  }

  private updateDifficulty(): void {
    // Increase difficulty every 30 seconds
    const playTime = this.engine.getAllGameObjects().length;
    this.difficulty = 1 + Math.floor(playTime / 30);

    // Adjust spawn rate
    this.spawnInterval = Math.max(0.3, 1.0 - this.difficulty * 0.1);

    // Level up every 100 points
    const newLevel = Math.floor(this.state.score / 100) + 1;
    if (newLevel > this.state.level) {
      this.state.level = newLevel;
      this.soundManager.play('levelup');
      this.particleSystem.createFireworks();
    }
  }

  private renderCombo(ctx: CanvasRenderingContext2D): void {
    const comboText = `${this.state.combo}x COMBO!`;
    const fontSize = 20 + Math.min(this.state.combo * 2, 40);

    ctx.save();
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';

    const x = window.innerWidth / 2;
    const y = window.innerHeight / 3;

    ctx.strokeText(comboText, x, y);
    ctx.fillText(comboText, x, y);
    ctx.restore();
  }

  private shakeScreen(): void {
    const canvas = this.canvas;
    let shakeAmount = 10;
    const shakeInterval = setInterval(() => {
      canvas.style.transform = `translate(${Math.random() * shakeAmount - shakeAmount / 2}px, ${Math.random() * shakeAmount - shakeAmount / 2}px)`;
      shakeAmount *= 0.9;

      if (shakeAmount < 0.5) {
        clearInterval(shakeInterval);
        canvas.style.transform = 'translate(0, 0)';
      }
    }, 50);
  }

  private gameOver(): void {
    this.state.isGameOver = true;
    this.soundManager.play('gameover');

    // Save high score
    if (this.state.score > this.state.highScore) {
      this.state.highScore = this.state.score;
      localStorage.setItem('potofgold_highscore', this.state.score.toString());
    }

    // Show game over screen
    this.ui.showGameOver(this.state);
  }

  private handleResize(): void {
    this.setupResponsiveCanvas();
    this.engine.resize(window.innerWidth, window.innerHeight);

    // Reposition game objects
    this.railTrack.updatePosition();
    this.cart.updateBounds();
  }

  public start(): void {
    this.engine.start();
    this.soundManager.play('background', true);
  }

  public pause(): void {
    this.state.isPaused = true;
    this.soundManager.pauseAll();
  }

  public resume(): void {
    this.state.isPaused = false;
    this.soundManager.resumeAll();
  }

  public restart(): void {
    // Reset game state
    this.state = {
      score: 0,
      coins: 0,
      stars: 0,
      hearts: 3,
      level: 1,
      combo: 0,
      highScore: this.state.highScore,
      isPaused: false,
      isGameOver: false,
    };

    // Clear all items
    const items = this.engine.getAllGameObjects().filter((obj) => obj.type === 'item');
    items.forEach((item) => this.engine.removeGameObject(item.id));

    // Reset cart position
    this.cart.reset();

    // Reset difficulty
    this.difficulty = 1;
    this.spawnInterval = 1.0;
    this.spawnTimer = 0;
  }

  public destroy(): void {
    this.engine.destroy();
    this.soundManager.destroy();
    window.removeEventListener('resize', this.handleResize.bind(this));
  }
}
