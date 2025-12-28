interface CollisionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FallingItem {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  collected: boolean;
}

interface MineCart {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class CollisionDetection {
  /**
   * Check if a falling item collides with the mine cart
   */
  static checkItemCollision(item: FallingItem, cart: MineCart): boolean {
    if (item.collected) return false;

    // Create collision boxes
    const itemBox: CollisionBox = {
      x: item.x - (item.width || 30) / 2,
      y: item.y,
      width: item.width || 30,
      height: item.height || 30,
    };

    const cartBox: CollisionBox = {
      x: cart.x - cart.width / 2,
      y: cart.y,
      width: cart.width,
      height: cart.height,
    };

    // Check for collision
    return this.checkBoxCollision(itemBox, cartBox);
  }

  /**
   * Check if two collision boxes intersect
   */
  static checkBoxCollision(box1: CollisionBox, box2: CollisionBox): boolean {
    return (
      box1.x < box2.x + box2.width &&
      box1.x + box1.width > box2.x &&
      box1.y < box2.y + box2.height &&
      box1.y + box1.height > box2.y
    );
  }

  /**
   * Get extended hitbox for mine cart (wider for better catching)
   */
  static getCartHitbox(cart: MineCart): CollisionBox {
    const extendedWidth = cart.width * 1.2; // 20% wider
    const extendedHeight = cart.height * 1.1; // 10% taller

    return {
      x: cart.x - extendedWidth / 2,
      y: cart.y - extendedHeight * 0.1, // Slightly higher
      width: extendedWidth,
      height: extendedHeight,
    };
  }

  /**
   * Check if item is within magnet range
   */
  static checkMagnetRange(item: FallingItem, cart: MineCart, range: number = 100): boolean {
    const distance = Math.abs(item.x - cart.x);
    return distance <= range;
  }

  /**
   * Get items that should be affected by magnet power-up
   */
  static getMagnetAffectedItems(
    items: FallingItem[],
    cart: MineCart,
    range: number = 100
  ): string[] {
    return items
      .filter((item) => !item.collected && this.checkMagnetRange(item, cart, range))
      .map((item) => item.id);
  }

  /**
   * Get items within explosion radius
   */
  static getExplosionAffectedItems(
    items: FallingItem[],
    cart: MineCart,
    radius: number = 150
  ): string[] {
    return items
      .filter((item) => !item.collected && Math.abs(item.x - cart.x) <= radius)
      .map((item) => item.id);
  }

  /**
   * Check if item is falling within cart's vertical range
   */
  static isItemInCartRange(item: FallingItem, cart: MineCart): boolean {
    const cartTop = cart.y;
    const cartBottom = cart.y + cart.height;
    const itemBottom = item.y + (item.height || 30);

    return itemBottom >= cartTop && item.y <= cartBottom;
  }

  /**
   * Get collision priority for different item types
   */
  static getCollisionPriority(itemType: string): number {
    const priorities: { [key: string]: number } = {
      luckyStar: 10, // Highest priority
      gemstone: 9,
      dynamite: 8,
      magnet: 7,
      lightning: 6,
      moneyBag: 5,
      coin: 4,
      blackRock: 3, // Lowest priority
    };

    return priorities[itemType] || 1;
  }
}
