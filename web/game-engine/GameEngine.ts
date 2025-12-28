/**
 * Professional HTML5 Game Engine for Pot of Gold
 * Competes with Candy Crush and other top mobile games
 */

export interface GameConfig {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  devicePixelRatio: number;
  debug?: boolean;
}

export interface GameObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX: number;
  velocityY: number;
  rotation: number;
  scale: number;
  alpha: number;
  visible: boolean;
  type: string;
  update(deltaTime: number): void;
  render(ctx: CanvasRenderingContext2D): void;
  destroy?(): void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private devicePixelRatio: number;
  private gameObjects: Map<string, GameObject> = new Map();
  private lastTime: number = 0;
  private deltaTime: number = 0;
  private fps: number = 0;
  private frameCount: number = 0;
  private fpsUpdateTime: number = 0;
  private isRunning: boolean = false;
  private debug: boolean = false;

  // Performance optimization
  private offscreenCanvas?: OffscreenCanvas;
  private offscreenCtx?: OffscreenCanvasRenderingContext2D;

  // Input handling
  private touches: Map<number, { x: number; y: number }> = new Map();
  private mousePosition: { x: number; y: number } = { x: 0, y: 0 };
  private isMouseDown: boolean = false;

  // Callbacks
  public onUpdate?: (deltaTime: number) => void;
  public onRender?: (ctx: CanvasRenderingContext2D) => void;
  public onTouch?: (x: number, y: number, type: 'start' | 'move' | 'end') => void;

  constructor(config: GameConfig) {
    this.canvas = config.canvas;
    this.ctx = this.canvas.getContext('2d', {
      alpha: false,
      desynchronized: true,
      willReadFrequently: false,
    })!;

    this.width = config.width;
    this.height = config.height;
    this.devicePixelRatio = config.devicePixelRatio || window.devicePixelRatio || 1;
    this.debug = config.debug || false;

    this.setupCanvas();
    this.setupInputHandlers();
    this.setupOffscreenCanvas();
  }

  private setupCanvas(): void {
    // Set actual canvas size accounting for device pixel ratio
    this.canvas.width = this.width * this.devicePixelRatio;
    this.canvas.height = this.height * this.devicePixelRatio;

    // Scale canvas back down using CSS
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    // Scale context to match device pixel ratio
    this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);

    // Enable image smoothing for better graphics
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  private setupOffscreenCanvas(): void {
    if (typeof OffscreenCanvas !== 'undefined') {
      this.offscreenCanvas = new OffscreenCanvas(
        this.width * this.devicePixelRatio,
        this.height * this.devicePixelRatio
      );
      this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;
      this.offscreenCtx.scale(this.devicePixelRatio, this.devicePixelRatio);
    }
  }

  private setupInputHandlers(): void {
    // Touch events for mobile
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), {
      passive: false,
    });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });

    // Mouse events for desktop
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));

    // Prevent context menu on right click
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();

    for (const touch of Array.from(e.changedTouches)) {
      const x = (touch.clientX - rect.left) * (this.width / rect.width);
      const y = (touch.clientY - rect.top) * (this.height / rect.height);
      this.touches.set(touch.identifier, { x, y });
      this.onTouch?.(x, y, 'start');
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();

    for (const touch of Array.from(e.changedTouches)) {
      const x = (touch.clientX - rect.left) * (this.width / rect.width);
      const y = (touch.clientY - rect.top) * (this.height / rect.height);
      this.touches.set(touch.identifier, { x, y });
      this.onTouch?.(x, y, 'move');
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();

    for (const touch of Array.from(e.changedTouches)) {
      const touchData = this.touches.get(touch.identifier);
      if (touchData) {
        this.onTouch?.(touchData.x, touchData.y, 'end');
        this.touches.delete(touch.identifier);
      }
    }
  }

  private handleMouseDown(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (this.width / rect.width);
    const y = (e.clientY - rect.top) * (this.height / rect.height);
    this.mousePosition = { x, y };
    this.isMouseDown = true;
    this.onTouch?.(x, y, 'start');
  }

  private handleMouseMove(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (this.width / rect.width);
    const y = (e.clientY - rect.top) * (this.height / rect.height);
    this.mousePosition = { x, y };

    if (this.isMouseDown) {
      this.onTouch?.(x, y, 'move');
    }
  }

  private handleMouseUp(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (this.width / rect.width);
    const y = (e.clientY - rect.top) * (this.height / rect.height);
    this.mousePosition = { x, y };
    this.isMouseDown = false;
    this.onTouch?.(x, y, 'end');
  }

  public addGameObject(object: GameObject): void {
    this.gameObjects.set(object.id, object);
  }

  public removeGameObject(id: string): void {
    const object = this.gameObjects.get(id);
    if (object) {
      object.destroy?.();
      this.gameObjects.delete(id);
    }
  }

  public getGameObject(id: string): GameObject | undefined {
    return this.gameObjects.get(id);
  }

  public getAllGameObjects(): GameObject[] {
    return Array.from(this.gameObjects.values());
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  public stop(): void {
    this.isRunning = false;
  }

  private gameLoop = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    this.deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap at 100ms
    this.lastTime = currentTime;

    // Update FPS counter
    this.frameCount++;
    if (currentTime - this.fpsUpdateTime > 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = currentTime;
    }

    // Update game state
    this.update(this.deltaTime);

    // Render frame
    this.render();

    // Continue loop
    requestAnimationFrame(this.gameLoop);
  };

  private update(deltaTime: number): void {
    // Update all game objects
    for (const object of this.gameObjects.values()) {
      if (object.visible) {
        object.update(deltaTime);
      }
    }

    // Custom update callback
    this.onUpdate?.(deltaTime);
  }

  private render(): void {
    // Clear canvas
    this.ctx.fillStyle = '#87CEEB'; // Sky blue background
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Render all game objects sorted by z-index (type)
    const sortedObjects = Array.from(this.gameObjects.values())
      .filter((obj) => obj.visible)
      .sort((a, b) => {
        const order = ['background', 'track', 'item', 'cart', 'effect', 'ui'];
        return order.indexOf(a.type) - order.indexOf(b.type);
      });

    for (const object of sortedObjects) {
      this.ctx.save();

      // Apply transformations
      this.ctx.globalAlpha = object.alpha;
      this.ctx.translate(object.x + object.width / 2, object.y + object.height / 2);
      this.ctx.rotate(object.rotation);
      this.ctx.scale(object.scale, object.scale);
      this.ctx.translate(-object.width / 2, -object.height / 2);

      // Render object
      object.render(this.ctx);

      this.ctx.restore();
    }

    // Custom render callback
    this.onRender?.(this.ctx);

    // Debug info
    if (this.debug) {
      this.renderDebugInfo();
    }
  }

  private renderDebugInfo(): void {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(10, 10, 150, 80);

    this.ctx.fillStyle = '#00FF00';
    this.ctx.font = '14px monospace';
    this.ctx.fillText(`FPS: ${this.fps}`, 20, 30);
    this.ctx.fillText(`Objects: ${this.gameObjects.size}`, 20, 50);
    this.ctx.fillText(`Touch: ${this.touches.size}`, 20, 70);
    this.ctx.restore();
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.setupCanvas();
    this.setupOffscreenCanvas();
  }

  public destroy(): void {
    this.stop();
    this.gameObjects.clear();

    // Remove event listeners
    this.canvas.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.canvas.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this));
  }
}
