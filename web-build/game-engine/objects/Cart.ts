import { GameObject, GameEngine } from '../GameEngine';

export class Cart implements GameObject {
  public id: string = 'cart';
  public x: number;
  public y: number;
  public width: number = 80;
  public height: number = 60;
  public velocityX: number = 0;
  public velocityY: number = 0;
  public rotation: number = 0;
  public scale: number = 1;
  public alpha: number = 1;
  public visible: boolean = true;
  public type: string = 'cart';
  
  private engine: GameEngine;
  private targetX: number;
  private speed: number = 800; // pixels per second
  private collectedCoins: number = 0;
  private goldPileHeight: number = 0;
  private wheelRotation: number = 0;
  
  // Visual effects
  private sparkles: Array<{x: number, y: number, life: number}> = [];
  private bounceAnimation: number = 0;
  
  constructor(engine: GameEngine, x: number, y: number) {
    this.engine = engine;
    this.x = x;
    this.y = y;
    this.targetX = x;
    engine.addGameObject(this);
  }
  
  public update(deltaTime: number): void {
    // Smooth movement to target position
    const dx = this.targetX - this.x;
    if (Math.abs(dx) > 2) {
      const moveSpeed = this.speed * deltaTime;
      const moveAmount = Math.min(Math.abs(dx), moveSpeed) * Math.sign(dx);
      this.x += moveAmount;
      
      // Rotate wheels when moving
      this.wheelRotation += Math.abs(moveAmount) * 0.1;
    }
    
    // Update visual effects
    this.updateSparkles(deltaTime);
    
    // Bounce animation when collecting items
    if (this.bounceAnimation > 0) {
      this.bounceAnimation -= deltaTime * 3;
      this.scale = 1 + Math.sin(this.bounceAnimation * Math.PI) * 0.1;
    } else {
      this.scale = 1;
    }
    
    // Update gold pile height based on collected coins
    this.goldPileHeight = Math.min(this.collectedCoins / 10, 20);
  }
  
  public render(ctx: CanvasRenderingContext2D): void {
    // Draw sparkles behind cart
    this.renderSparkles(ctx);
    
    // Draw gold pile on top (if coins collected)
    if (this.collectedCoins > 0) {
      this.renderGoldPile(ctx);
    }
    
    // Draw main cart body (keeping the design from potofgold3.png)
    this.renderCartBody(ctx);
    
    // Draw wheels
    this.renderWheels(ctx);
    
    // Draw stars above cart when doing well
    if (this.collectedCoins > 50) {
      this.renderStars(ctx);
    }
  }
  
  private renderCartBody(ctx: CanvasRenderingContext2D): void {
    // Cart body - brown wooden design
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#8B4513');
    gradient.addColorStop(1, '#654321');
    
    // Main body
    ctx.fillStyle = gradient;
    ctx.fillRect(5, 10, this.width - 10, this.height - 20);
    
    // Cart rim
    ctx.fillStyle = '#5C3A1E';
    ctx.fillRect(5, 10, this.width - 10, 8);
    
    // Cart details - wooden planks
    ctx.strokeStyle = '#4A2F18';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const x = 15 + i * 20;
      ctx.beginPath();
      ctx.moveTo(x, 18);
      ctx.lineTo(x, this.height - 10);
      ctx.stroke();
    }
    
    // Metal bolts
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(15, 25, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.width - 15, 25, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Gold inside cart (visible through top)
    if (this.collectedCoins > 0) {
      const goldGradient = ctx.createLinearGradient(0, 20, 0, this.height - 10);
      goldGradient.addColorStop(0, 'rgba(255, 215, 0, 0)');
      goldGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.3)');
      goldGradient.addColorStop(1, 'rgba(255, 165, 0, 0.6)');
      
      ctx.fillStyle = goldGradient;
      ctx.fillRect(10, 20, this.width - 20, this.height - 30);
    }
  }
  
  private renderWheels(ctx: CanvasRenderingContext2D): void {
    const wheelY = this.height - 8;
    const wheelRadius = 12;
    
    // Left wheel
    this.renderWheel(ctx, 20, wheelY, wheelRadius);
    
    // Right wheel
    this.renderWheel(ctx, this.width - 20, wheelY, wheelRadius);
  }
  
  private renderWheel(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.wheelRotation);
    
    // Wheel outer
    ctx.fillStyle = '#2C2C2C';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Wheel rim
    ctx.strokeStyle = '#1A1A1A';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Wheel spokes
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.rotate((Math.PI / 2) * i);
      ctx.beginPath();
      ctx.moveTo(0, -radius + 2);
      ctx.lineTo(0, radius - 2);
      ctx.stroke();
      ctx.restore();
    }
    
    // Center hub
    ctx.fillStyle = '#666';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
  
  private renderGoldPile(ctx: CanvasRenderingContext2D): void {
    const coins = Math.min(5, Math.floor(this.collectedCoins / 20));
    
    for (let i = 0; i < coins; i++) {
      const x = this.width / 2 + (i % 2) * 10 - 5;
      const y = -10 - i * 3;
      
      // Gold coin gradient
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 15);
      gradient.addColorStop(0, '#FFD700');
      gradient.addColorStop(1, '#FFA500');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.fill();
      
      // Coin shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(x - 5, y - 5, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  private renderStars(ctx: CanvasRenderingContext2D): void {
    const starCount = Math.min(5, Math.floor(this.collectedCoins / 100));
    
    for (let i = 0; i < starCount; i++) {
      const x = this.width / 2 + (i - starCount / 2) * 15;
      const y = -30;
      
      ctx.fillStyle = '#FFD700';
      this.drawStar(ctx, x, y, 6, 5, 2);
    }
  }
  
  private drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number): void {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;
    
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;
      
      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  }
  
  private updateSparkles(deltaTime: number): void {
    // Update existing sparkles
    this.sparkles = this.sparkles.filter(sparkle => {
      sparkle.life -= deltaTime;
      sparkle.y -= 50 * deltaTime;
      return sparkle.life > 0;
    });
    
    // Add new sparkles when moving fast
    if (Math.abs(this.targetX - this.x) > 50 && Math.random() < 0.3) {
      this.sparkles.push({
        x: this.width / 2 + (Math.random() - 0.5) * 20,
        y: this.height - 10,
        life: 0.5
      });
    }
  }
  
  private renderSparkles(ctx: CanvasRenderingContext2D): void {
    for (const sparkle of this.sparkles) {
      ctx.save();
      ctx.globalAlpha = sparkle.life * 2;
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(sparkle.x, sparkle.y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  
  public moveTo(x: number): void {
    this.targetX = Math.max(0, Math.min(x - this.width / 2, 
      this.engine['width'] - this.width));
  }
  
  public collectItem(itemType: string): void {
    if (itemType === 'coin' || itemType === 'diamond' || itemType === 'star') {
      this.collectedCoins++;
      this.bounceAnimation = 1;
    }
  }
  
  public getBounds(): { x: number, y: number, width: number, height: number } {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
  
  public updateBounds(): void {
    // Called on window resize
    this.y = this.engine['height'] - 150;
  }
  
  public reset(): void {
    this.collectedCoins = 0;
    this.goldPileHeight = 0;
    this.sparkles = [];
    this.bounceAnimation = 0;
    this.wheelRotation = 0;
    this.x = this.engine['width'] / 2 - 40;
    this.targetX = this.x;
  }
  
  public destroy(): void {
    // Cleanup
  }
}