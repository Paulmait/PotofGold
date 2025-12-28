import { Platform } from 'react-native';

export interface GameLoopOptions {
  targetFPS?: number;
  enableFrameSkipping?: boolean;
  maxFrameSkip?: number;
  slowMotionFactor?: number;
}

export class GameLoop {
  private animationId: number | null = null;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private targetFPS: number;
  private frameTime: number;
  private maxFrameTime: number;
  private enableFrameSkipping: boolean;
  private maxFrameSkip: number;
  private slowMotionFactor: number;
  private isRunning: boolean = false;
  private frameCount: number = 0;
  private fps: number = 0;
  private lastFPSUpdate: number = 0;
  private skippedFrames: number = 0;
  private performanceMode: 'high' | 'medium' | 'low' = 'high';
  private updateCallback: ((deltaTime: number) => void) | null = null;
  private renderCallback: ((interpolation: number) => void) | null = null;

  constructor(options: GameLoopOptions = {}) {
    this.targetFPS = options.targetFPS || 60;
    this.frameTime = 1000 / this.targetFPS;
    this.maxFrameTime = this.frameTime * 10; // Max 10 frames worth of time
    this.enableFrameSkipping = options.enableFrameSkipping ?? true;
    this.maxFrameSkip = options.maxFrameSkip || 5;
    this.slowMotionFactor = options.slowMotionFactor || 1;
  }

  /**
   * Start the game loop
   */
  start(update: (deltaTime: number) => void, render: (interpolation: number) => void): void {
    if (this.isRunning) return;

    this.updateCallback = update;
    this.renderCallback = render;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.lastFPSUpdate = this.lastTime;

    this.detectPerformanceMode();
    this.loop(this.lastTime);
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Main loop using requestAnimationFrame
   */
  private loop = (currentTime: number): void => {
    if (!this.isRunning) return;

    // Calculate delta time
    const deltaTime = Math.min(currentTime - this.lastTime, this.maxFrameTime);
    this.lastTime = currentTime;

    // Add to accumulator
    this.accumulator += deltaTime * this.slowMotionFactor;

    // Frame skipping logic
    let framesSkipped = 0;

    // Update at fixed timestep with frame skipping
    while (this.accumulator >= this.frameTime) {
      if (this.updateCallback) {
        this.updateCallback(this.frameTime / 1000); // Convert to seconds
      }

      this.accumulator -= this.frameTime;

      // Frame skipping for low-end devices
      if (
        this.enableFrameSkipping &&
        framesSkipped < this.maxFrameSkip &&
        this.performanceMode === 'low'
      ) {
        framesSkipped++;
        if (this.accumulator >= this.frameTime * 2) {
          // Skip this frame if we're falling behind
          this.skippedFrames++;
          continue;
        }
      }
    }

    // Render with interpolation for smooth visuals
    const interpolation = this.accumulator / this.frameTime;
    if (this.renderCallback) {
      this.renderCallback(interpolation);
    }

    // Update FPS counter
    this.updateFPS(currentTime);

    // Schedule next frame
    this.animationId = requestAnimationFrame(this.loop);
  };

  /**
   * Update FPS calculation
   */
  private updateFPS(currentTime: number): void {
    this.frameCount++;

    if (currentTime - this.lastFPSUpdate >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFPSUpdate = currentTime;

      // Adjust performance mode based on FPS
      this.adjustPerformanceMode();
    }
  }

  /**
   * Detect initial performance mode based on device
   */
  private detectPerformanceMode(): void {
    if (Platform.OS === 'web') {
      // Check for high-end features
      const highEnd = window.devicePixelRatio > 1 && navigator.hardwareConcurrency > 4;
      this.performanceMode = highEnd ? 'high' : 'medium';
    } else {
      // Mobile defaults
      this.performanceMode = 'medium';
    }
  }

  /**
   * Dynamically adjust performance mode based on FPS
   */
  private adjustPerformanceMode(): void {
    if (this.fps < 30 && this.performanceMode !== 'low') {
      this.performanceMode = 'low';
      this.onPerformanceModeChange('low');
    } else if (this.fps >= 45 && this.fps < 55 && this.performanceMode !== 'medium') {
      this.performanceMode = 'medium';
      this.onPerformanceModeChange('medium');
    } else if (this.fps >= 55 && this.performanceMode !== 'high') {
      this.performanceMode = 'high';
      this.onPerformanceModeChange('high');
    }
  }

  /**
   * Handle performance mode changes
   */
  private onPerformanceModeChange(mode: 'high' | 'medium' | 'low'): void {
    console.log(`Performance mode changed to: ${mode}`);

    // Adjust settings based on mode
    switch (mode) {
      case 'low':
        this.maxFrameSkip = 10;
        this.targetFPS = 30;
        break;
      case 'medium':
        this.maxFrameSkip = 5;
        this.targetFPS = 45;
        break;
      case 'high':
        this.maxFrameSkip = 2;
        this.targetFPS = 60;
        break;
    }

    this.frameTime = 1000 / this.targetFPS;
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.fps;
  }

  /**
   * Get performance metrics
   */
  getMetrics(): {
    fps: number;
    skippedFrames: number;
    performanceMode: string;
  } {
    return {
      fps: this.fps,
      skippedFrames: this.skippedFrames,
      performanceMode: this.performanceMode,
    };
  }

  /**
   * Set slow motion factor (for debugging or effects)
   */
  setSlowMotion(factor: number): void {
    this.slowMotionFactor = Math.max(0.1, Math.min(10, factor));
  }

  /**
   * Pause the game loop
   */
  pause(): void {
    this.isRunning = false;
  }

  /**
   * Resume the game loop
   */
  resume(): void {
    if (!this.isRunning && this.updateCallback && this.renderCallback) {
      this.isRunning = true;
      this.lastTime = performance.now();
      this.loop(this.lastTime);
    }
  }
}

// Singleton instance
let gameLoopInstance: GameLoop | null = null;

export function getGameLoop(options?: GameLoopOptions): GameLoop {
  if (!gameLoopInstance) {
    gameLoopInstance = new GameLoop(options);
  }
  return gameLoopInstance;
}

// Hook for React components
export function useGameLoop() {
  const gameLoop = getGameLoop();

  return {
    start: gameLoop.start.bind(gameLoop),
    stop: gameLoop.stop.bind(gameLoop),
    pause: gameLoop.pause.bind(gameLoop),
    resume: gameLoop.resume.bind(gameLoop),
    getFPS: gameLoop.getFPS.bind(gameLoop),
    getMetrics: gameLoop.getMetrics.bind(gameLoop),
  };
}
