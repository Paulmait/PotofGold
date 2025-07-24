import { SkinConfig } from './unlockManager';

interface SkinData {
  name: string;
  type: 'flag' | 'shape' | 'trail';
  unlock: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'seasonal';
  season?: string;
  available?: boolean;
  asset: string;
  description: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
}

interface StateSkinsConfig {
  [key: string]: SkinData;
}

class SkinLoader {
  private static skinCache: StateSkinsConfig | null = null;
  private static isLoading = false;

  /**
   * Load all skin data from config file
   */
  static async loadAllSkins(): Promise<StateSkinsConfig> {
    if (this.skinCache) {
      return this.skinCache;
    }

    if (this.isLoading) {
      // Wait for current load to complete
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.skinCache!;
    }

    try {
      this.isLoading = true;
      
      // In a real app, this would load from the actual JSON file
      // For now, we'll use a hardcoded mapping
      const skins: StateSkinsConfig = {
        california: {
          name: "Golden Bear Flag",
          type: "flag",
          unlock: "Collect 1,000 coins",
          rarity: "rare",
          asset: "flags/california_flag.png",
          description: "Golden state flag with bear emblem",
          theme: {
            primaryColor: "#FFD700",
            secondaryColor: "#8B4513",
            accentColor: "#FFA500"
          }
        },
        texas: {
          name: "Lone Star Cart",
          type: "shape",
          unlock: "Reach Level 5",
          rarity: "common",
          asset: "shapes/texas_shape.png",
          description: "Texas state outline with lone star",
          theme: {
            primaryColor: "#1E3A8A",
            secondaryColor: "#F59E0B",
            accentColor: "#EF4444"
          }
        },
        florida: {
          name: "Sunshine Seal Wrap",
          type: "flag",
          unlock: "Score 300 in one round",
          rarity: "uncommon",
          asset: "flags/florida_flag.png",
          description: "Sunshine state flag with seal",
          theme: {
            primaryColor: "#1E3A8A",
            secondaryColor: "#F59E0B",
            accentColor: "#EF4444"
          }
        },
        georgia: {
          name: "Peach Glow Trail",
          type: "trail",
          unlock: "Invite 1 friend",
          rarity: "rare",
          asset: "trails/georgia_trail.png",
          description: "Peach blossom particle trail",
          theme: {
            primaryColor: "#F59E0B",
            secondaryColor: "#EF4444",
            accentColor: "#059669"
          }
        },
        hawaii: {
          name: "Hibiscus Drift Trail",
          type: "trail",
          unlock: "Survive 60 seconds without missing",
          rarity: "legendary",
          asset: "trails/hawaii_trail.png",
          description: "Hibiscus flower particle trail",
          theme: {
            primaryColor: "#059669",
            secondaryColor: "#F59E0B",
            accentColor: "#EF4444"
          }
        },
        // Seasonal skins
        georgia_bhm: {
          name: "Black History Trail (GA)",
          type: "trail",
          rarity: "seasonal",
          season: "black_history_month",
          unlock: "Play during February",
          asset: "trails/bhm_georgia_trail.png",
          available: true,
          description: "Special Black History Month trail for Georgia",
          theme: {
            primaryColor: "#1E3A8A",
            secondaryColor: "#EF4444",
            accentColor: "#F59E0B"
          }
        },
        texas_hispanic: {
          name: "Hispanic Heritage Cart (TX)",
          type: "flag",
          rarity: "seasonal",
          season: "hispanic_heritage",
          unlock: "Login during Hispanic Heritage Month",
          asset: "flags/texas_hispanic_flag.png",
          available: true,
          description: "Special Hispanic Heritage flag for Texas",
          theme: {
            primaryColor: "#F59E0B",
            secondaryColor: "#EF4444",
            accentColor: "#1E3A8A"
          }
        },
        // Add more skins as needed...
      };

      this.skinCache = skins;
      return skins;
    } catch (error) {
      console.error('Error loading skin data:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Get a specific skin by ID
   */
  static async getSkin(skinId: string): Promise<SkinData | null> {
    try {
      const skins = await this.loadAllSkins();
      return skins[skinId] || null;
    } catch (error) {
      console.error(`Error loading skin ${skinId}:`, error);
      return null;
    }
  }

  /**
   * Get skins by type
   */
  static async getSkinsByType(type: 'flag' | 'shape' | 'trail'): Promise<SkinData[]> {
    try {
      const skins = await this.loadAllSkins();
      return Object.values(skins).filter(skin => skin.type === type);
    } catch (error) {
      console.error(`Error loading skins by type ${type}:`, error);
      return [];
    }
  }

  /**
   * Get skins by rarity
   */
  static async getSkinsByRarity(rarity: string): Promise<SkinData[]> {
    try {
      const skins = await this.loadAllSkins();
      return Object.values(skins).filter(skin => skin.rarity === rarity);
    } catch (error) {
      console.error(`Error loading skins by rarity ${rarity}:`, error);
      return [];
    }
  }

  /**
   * Get seasonal skins
   */
  static async getSeasonalSkins(): Promise<SkinData[]> {
    try {
      const skins = await this.loadAllSkins();
      return Object.values(skins).filter(skin => skin.rarity === 'seasonal');
    } catch (error) {
      console.error('Error loading seasonal skins:', error);
      return [];
    }
  }

  /**
   * Get available skins (not disabled)
   */
  static async getAvailableSkins(): Promise<SkinData[]> {
    try {
      const skins = await this.loadAllSkins();
      return Object.values(skins).filter(skin => skin.available !== false);
    } catch (error) {
      console.error('Error loading available skins:', error);
      return [];
    }
  }

  /**
   * Clear the skin cache
   */
  static clearCache(): void {
    this.skinCache = null;
  }

  /**
   * Convert skin data to SkinConfig format for UnlockManager
   */
  static convertToSkinConfig(skinData: SkinData): SkinConfig {
    return {
      id: '', // This would be set by the caller
      name: skinData.name,
      type: skinData.type,
      unlock: skinData.unlock,
      rarity: skinData.rarity,
      seasonalEvent: skinData.season,
      condition: {
        type: 'level', // This would be parsed from unlock string
        value: 1,
      },
    };
  }
}

export default SkinLoader;
export type { SkinData, StateSkinsConfig }; 