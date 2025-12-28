import { offlineManager } from './offlineManager';

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: Date;
  lastLogin: Date;
  totalPlayTime: number;
  devices: string[];
  inviteCode: string;
  invitedBy?: string;
  invitedUsers: string[];
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  isOnline: boolean;
  lastSync: Date | null;
  pendingActions: any[];
}

export interface InviteBonus {
  id: string;
  type: 'coins' | 'gems' | 'skin' | 'powerup';
  amount: number;
  itemId?: string;
  description: string;
  claimed: boolean;
}

export interface SeasonalReward {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  reward: {
    type: 'skin' | 'coins' | 'gems';
    itemId?: string;
    amount: number;
  };
  claimed: boolean;
}

export class AuthSystem {
  private static instance: AuthSystem;
  private authState: AuthState | null = null;
  private inviteBonuses: InviteBonus[] = [];
  private seasonalRewards: SeasonalReward[] = [];

  static getInstance(): AuthSystem {
    if (!AuthSystem.instance) {
      AuthSystem.instance = new AuthSystem();
    }
    return AuthSystem.instance;
  }

  // Initialize authentication
  async initializeAuth(): Promise<AuthState> {
    try {
      const offlineData = await offlineManager.getOfflineData('auth');

      if (offlineData.authState) {
        this.authState = offlineData.authState;
        return this.authState;
      }
    } catch (error) {
      console.log('Error loading auth data:', error);
    }

    // Create default auth state
    this.authState = {
      isAuthenticated: false,
      user: null,
      isOnline: false,
      lastSync: null,
      pendingActions: [],
    };

    await this.saveAuthState();
    return this.authState;
  }

  // Sign up user
  async signUp(
    email: string,
    password: string,
    displayName: string
  ): Promise<{
    success: boolean;
    user: UserProfile | null;
    message: string;
  }> {
    try {
      // In real app, this would call Firebase Auth
      const userId = `user_${Date.now()}`;
      const inviteCode = this.generateInviteCode();

      const user: UserProfile = {
        userId,
        email,
        displayName,
        createdAt: new Date(),
        lastLogin: new Date(),
        totalPlayTime: 0,
        devices: [],
        inviteCode,
        invitedUsers: [],
      };

      this.authState!.user = user;
      this.authState!.isAuthenticated = true;
      this.authState!.lastSync = new Date();

      // 📦 BONUS: Onboarding Tip - Pre-fill Firestore document
      await this.initializeUserDocument(userId);

      await this.saveAuthState();
      await this.syncUserData();

      return {
        success: true,
        user,
        message: 'Account created successfully!',
      };
    } catch (error) {
      return {
        success: false,
        user: null,
        message: 'Failed to create account',
      };
    }
  }

  // Initialize user document with onboarding data
  private async initializeUserDocument(uid: string): Promise<void> {
    try {
      // In real app, this would use Firebase Firestore
      // await firestore().collection('users').doc(uid).set({
      //   coins: 100,
      //   potLevel: 1,
      //   ownedSkins: ['florida'],
      //   currentSkin: 'florida',
      //   lastLoginDate: new Date().toISOString()
      // });

      // For demo, we'll save to offline storage
      const onboardingData = {
        coins: 100,
        potLevel: 1,
        ownedSkins: ['florida'],
        currentSkin: 'florida',
        lastLoginDate: new Date().toISOString(),
        // Additional onboarding data
        gems: 10,
        experience: 0,
        level: 1,
        dailyStreak: 1,
        totalPlayTime: 0,
        achievements: [],
        missions: [],
        chapters: [
          {
            id: 'chapter_1',
            name: 'Gold Cavern',
            unlocked: true,
            completed: false,
            currentLevel: 1,
          },
        ],
        camp: {
          level: 1,
          buildings: [],
          totalCoinGeneration: 0,
        },
        shop: {
          lastRefresh: new Date().toISOString(),
          availableItems: [],
        },
        seasonPass: {
          currentSeason: 'season_1',
          experience: 0,
          tier: 1,
          claimedRewards: [],
        },
        // Invite system data
        inviteCode: this.generateInviteCode(),
        invitedUsers: [],
        invitedBy: null,
        inviteBonuses: [],
        // Seasonal rewards
        seasonalRewards: [],
        // Collection progress
        skinCollection: {
          ownedSkins: ['florida'],
          equippedSkin: 'florida',
          totalSkins: 15, // Total available skins
          collectionProgress: 6.67, // 1/15 * 100
        },
        // Game settings
        settings: {
          soundEnabled: true,
          musicEnabled: true,
          vibrationEnabled: true,
          notificationsEnabled: true,
        },
        // Analytics data
        analytics: {
          firstPlayDate: new Date().toISOString(),
          totalGamesPlayed: 0,
          totalCoinsCollected: 0,
          totalTimePlayed: 0,
          favoriteSkin: 'florida',
        },
      };

      await offlineManager.saveOfflineData(uid, onboardingData);

      // Add to pending actions for cloud sync
      await offlineManager.addPendingAction(uid, {
        type: 'user_creation',
        data: onboardingData,
        timestamp: new Date().toISOString(),
      });

      console.log('✅ User document initialized with onboarding data:', onboardingData);
    } catch (error) {
      console.log('❌ Error initializing user document:', error);
    }
  }

  // Sign in user
  async signIn(
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    user: UserProfile | null;
    message: string;
  }> {
    try {
      // In real app, this would call Firebase Auth
      // For demo, we'll create a mock user
      const user: UserProfile = {
        userId: 'demo_user',
        email,
        displayName: 'Demo User',
        createdAt: new Date(),
        lastLogin: new Date(),
        totalPlayTime: 0,
        devices: [],
        inviteCode: 'DEMO123',
        invitedUsers: [],
      };

      this.authState!.user = user;
      this.authState!.isAuthenticated = true;
      this.authState!.lastSync = new Date();

      await this.saveAuthState();
      await this.syncUserData();

      return {
        success: true,
        user,
        message: 'Signed in successfully!',
      };
    } catch (error) {
      return {
        success: false,
        user: null,
        message: 'Failed to sign in',
      };
    }
  }

  // Sign out user
  async signOut(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      this.authState!.isAuthenticated = false;
      this.authState!.user = null;
      this.authState!.lastSync = null;

      await this.saveAuthState();

      return {
        success: true,
        message: 'Signed out successfully!',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to sign out',
      };
    }
  }

  // Sync user data with cloud
  async syncUserData(): Promise<{
    success: boolean;
    syncedData: any;
    message: string;
  }> {
    if (!this.authState?.user) {
      return { success: false, syncedData: null, message: 'No user logged in' };
    }

    try {
      // In real app, this would sync with Firestore
      const userData = await offlineManager.getOfflineData(this.authState.user.userId);

      // Sync progress, unlocks, coins, etc.
      const syncedData = {
        progress: userData.progress || {},
        unlocks: userData.unlocks || {},
        coins: userData.coins || 0,
        gems: userData.gems || 0,
        skins: userData.skins || [],
        chapters: userData.chapters || [],
      };

      this.authState.lastSync = new Date();
      await this.saveAuthState();

      return {
        success: true,
        syncedData,
        message: 'Data synced successfully!',
      };
    } catch (error) {
      return {
        success: false,
        syncedData: null,
        message: 'Failed to sync data',
      };
    }
  }

  // Generate invite code
  private generateInviteCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Use invite code
  async useInviteCode(code: string): Promise<{
    success: boolean;
    bonus: InviteBonus | null;
    message: string;
  }> {
    if (!this.authState?.user) {
      return { success: false, bonus: null, message: 'Not logged in' };
    }

    // In real app, this would validate against database
    if (code === 'DEMO123') {
      const bonus: InviteBonus = {
        id: 'invite_bonus',
        type: 'coins',
        amount: 100,
        description: 'Welcome bonus for using invite code!',
        claimed: false,
      };

      this.inviteBonuses.push(bonus);
      await this.saveAuthState();

      return {
        success: true,
        bonus,
        message: 'Invite code accepted! +100 coins',
      };
    }

    return {
      success: false,
      bonus: null,
      message: 'Invalid invite code',
    };
  }

  // Get seasonal rewards
  getSeasonalRewards(): SeasonalReward[] {
    const now = new Date();

    return [
      {
        id: 'state_week_2024',
        name: 'State Week 2024',
        description: 'Login during State Week to get a bonus state skin!',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-22'),
        reward: {
          type: 'skin',
          itemId: 'texas_pot',
          amount: 1,
        },
        claimed: false,
      },
      {
        id: 'zodiac_month',
        name: 'Zodiac Month',
        description: 'Special zodiac skins available this month!',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        reward: {
          type: 'skin',
          itemId: 'libra_pot',
          amount: 1,
        },
        claimed: false,
      },
    ].filter((reward) => now >= reward.startDate && now <= reward.endDate);
  }

  // Claim seasonal reward
  async claimSeasonalReward(rewardId: string): Promise<{
    success: boolean;
    reward: SeasonalReward | null;
    message: string;
  }> {
    const reward = this.getSeasonalRewards().find((r) => r.id === rewardId);

    if (!reward) {
      return { success: false, reward: null, message: 'Reward not found' };
    }

    if (reward.claimed) {
      return { success: false, reward: null, message: 'Reward already claimed' };
    }

    reward.claimed = true;
    await this.saveAuthState();

    return {
      success: true,
      reward,
      message: `Claimed ${reward.name}!`,
    };
  }

  // Get user profile
  getUserProfile(): UserProfile | null {
    return this.authState?.user || null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.authState?.isAuthenticated || false;
  }

  // Get invite bonuses
  getInviteBonuses(): InviteBonus[] {
    return this.inviteBonuses;
  }

  // Save auth state
  private async saveAuthState(): Promise<void> {
    if (!this.authState) return;

    try {
      await offlineManager.saveOfflineData('auth', {
        authState: this.authState,
      });
    } catch (error) {
      console.log('Error saving auth state:', error);
    }
  }
}

export const authSystem = AuthSystem.getInstance();
