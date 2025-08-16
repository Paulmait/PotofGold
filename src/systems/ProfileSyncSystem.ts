/**
 * Profile Sync System
 * Manages cross-device profile synchronization and device-specific optimizations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Platform, Dimensions, PixelRatio } from 'react-native';
import { firestore, auth } from '../../firebase/config';
import NetInfo from '@react-native-community/netinfo';

export interface UserProfile {
  uid: string;
  username: string;
  email?: string;
  displayName: string;
  avatar?: string;
  level: number;
  experience: number;
  coins: number;
  gems: number;
  highScore: number;
  totalGamesPlayed: number;
  achievements: string[];
  unlockedItems: string[];
  settings: UserSettings;
  subscription?: SubscriptionData;
  lastSyncedAt: string;
  createdAt: string;
  devices: DeviceInfo[];
}

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: 'phone' | 'tablet' | 'tv' | 'desktop' | 'unknown';
  platform: string;
  platformVersion: string;
  brand?: string;
  model?: string;
  screenWidth: number;
  screenHeight: number;
  pixelDensity: number;
  isTablet: boolean;
  lastActiveAt: string;
  installationId: string;
  graphicsQuality: 'low' | 'medium' | 'high' | 'ultra';
  gameSettings: GameSettings;
}

export interface UserSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticEnabled: boolean;
  notificationsEnabled: boolean;
  language: string;
  theme: 'light' | 'dark' | 'auto';
  graphicsQuality: 'auto' | 'low' | 'medium' | 'high' | 'ultra';
}

export interface GameSettings {
  particleEffects: boolean;
  shadowQuality: 'off' | 'low' | 'medium' | 'high';
  targetFPS: 30 | 60 | 120;
  reducedMotion: boolean;
  textureQuality: 'low' | 'medium' | 'high';
}

export interface SubscriptionData {
  tier: string;
  expiresAt: string;
  autoRenew: boolean;
}

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime?: string;
  syncErrors: string[];
  pendingChanges: number;
  networkStatus: 'online' | 'offline';
}

class ProfileSyncSystem {
  private currentProfile: UserProfile | null = null;
  private currentDevice: DeviceInfo | null = null;
  private syncStatus: SyncStatus = {
    isSyncing: false,
    syncErrors: [],
    pendingChanges: 0,
    networkStatus: 'online'
  };
  private syncInterval: NodeJS.Timeout | null = null;
  private offlineQueue: any[] = [];
  private readonly SYNC_INTERVAL = 30000; // 30 seconds

  async initialize(userId?: string) {
    try {
      // Get or create device info
      this.currentDevice = await this.getDeviceInfo();
      
      // Setup network monitoring
      this.setupNetworkMonitoring();
      
      // Load or create user profile
      if (userId || auth.currentUser?.uid) {
        await this.loadUserProfile(userId || auth.currentUser!.uid);
      }
      
      // Start auto-sync
      this.startAutoSync();
      
      // Register device
      await this.registerDevice();
      
    } catch (error) {
      console.error('Failed to initialize profile sync:', error);
    }
  }

  private async getDeviceInfo(): Promise<DeviceInfo> {
    const { width, height } = Dimensions.get('window');
    const deviceId = await this.getDeviceId();
    
    // Determine graphics quality based on device
    const graphicsQuality = this.determineGraphicsQuality();
    
    const deviceInfo: DeviceInfo = {
      deviceId,
      deviceName: Device.deviceName || 'Unknown Device',
      deviceType: this.getDeviceType(),
      platform: Platform.OS,
      platformVersion: Platform.Version.toString(),
      brand: Device.brand || undefined,
      model: Device.modelName || undefined,
      screenWidth: width,
      screenHeight: height,
      pixelDensity: PixelRatio.get(),
      isTablet: Device.deviceType === Device.DeviceType.TABLET,
      lastActiveAt: new Date().toISOString(),
      installationId: Application.applicationId || 'unknown',
      graphicsQuality,
      gameSettings: this.getOptimalGameSettings(graphicsQuality)
    };

    return deviceInfo;
  }

  private async getDeviceId(): Promise<string> {
    // Try to get existing device ID
    let deviceId = await AsyncStorage.getItem('device_id');
    
    if (!deviceId) {
      // Generate unique device ID
      if (Platform.OS === 'ios') {
        deviceId = await Application.getIosIdForVendorAsync() || this.generateDeviceId();
      } else if (Platform.OS === 'android') {
        deviceId = Application.androidId || this.generateDeviceId();
      } else {
        deviceId = this.generateDeviceId();
      }
      
      await AsyncStorage.setItem('device_id', deviceId);
    }
    
    return deviceId;
  }

  private generateDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceType(): DeviceInfo['deviceType'] {
    if (Platform.isTV) return 'tv';
    if (Platform.OS === 'web') return 'desktop';
    if (Device.deviceType === Device.DeviceType.TABLET) return 'tablet';
    if (Device.deviceType === Device.DeviceType.PHONE) return 'phone';
    return 'unknown';
  }

  private determineGraphicsQuality(): DeviceInfo['graphicsQuality'] {
    // Determine based on device capabilities
    const { width, height } = Dimensions.get('window');
    const pixelCount = width * height * PixelRatio.get();
    
    // Check device year and RAM if available
    const deviceYear = Device.deviceYearClass;
    
    if (Platform.OS === 'ios') {
      // iOS devices generally have good performance
      if (pixelCount > 3000000) return 'ultra';
      if (pixelCount > 2000000) return 'high';
      return 'medium';
    } else if (Platform.OS === 'android') {
      // Android varies more
      if (deviceYear && deviceYear >= 2020 && pixelCount > 2000000) return 'high';
      if (deviceYear && deviceYear >= 2018) return 'medium';
      return 'low';
    }
    
    return 'medium';
  }

  private getOptimalGameSettings(quality: DeviceInfo['graphicsQuality']): GameSettings {
    const settings: Record<DeviceInfo['graphicsQuality'], GameSettings> = {
      low: {
        particleEffects: false,
        shadowQuality: 'off',
        targetFPS: 30,
        reducedMotion: true,
        textureQuality: 'low'
      },
      medium: {
        particleEffects: true,
        shadowQuality: 'low',
        targetFPS: 30,
        reducedMotion: false,
        textureQuality: 'medium'
      },
      high: {
        particleEffects: true,
        shadowQuality: 'medium',
        targetFPS: 60,
        reducedMotion: false,
        textureQuality: 'high'
      },
      ultra: {
        particleEffects: true,
        shadowQuality: 'high',
        targetFPS: 120,
        reducedMotion: false,
        textureQuality: 'high'
      }
    };

    return settings[quality];
  }

  // Profile Management
  async loadUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      // Try to load from local first
      const localProfile = await this.loadLocalProfile(userId);
      
      // Then sync with cloud
      const cloudProfile = await this.loadCloudProfile(userId);
      
      if (cloudProfile) {
        // Merge profiles (cloud takes precedence)
        this.currentProfile = this.mergeProfiles(localProfile, cloudProfile);
        await this.saveLocalProfile(this.currentProfile);
      } else if (localProfile) {
        this.currentProfile = localProfile;
        // Push to cloud if not exists
        await this.saveCloudProfile(this.currentProfile);
      } else {
        // Create new profile
        this.currentProfile = await this.createNewProfile(userId);
      }
      
      return this.currentProfile;
    } catch (error) {
      console.error('Failed to load user profile:', error);
      return null;
    }
  }

  private async loadLocalProfile(userId: string): Promise<UserProfile | null> {
    try {
      const stored = await AsyncStorage.getItem(`profile_${userId}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load local profile:', error);
      return null;
    }
  }

  private async loadCloudProfile(userId: string): Promise<UserProfile | null> {
    try {
      const doc = await firestore
        .collection('users')
        .doc(userId)
        .get();
      
      return doc.exists ? doc.data() as UserProfile : null;
    } catch (error) {
      console.error('Failed to load cloud profile:', error);
      return null;
    }
  }

  private async createNewProfile(userId: string): Promise<UserProfile> {
    const profile: UserProfile = {
      uid: userId,
      username: `Player${Math.floor(Math.random() * 9999)}`,
      displayName: 'New Player',
      level: 1,
      experience: 0,
      coins: 100,
      gems: 10,
      highScore: 0,
      totalGamesPlayed: 0,
      achievements: [],
      unlockedItems: [],
      settings: {
        soundEnabled: true,
        musicEnabled: true,
        hapticEnabled: true,
        notificationsEnabled: true,
        language: 'en',
        theme: 'auto',
        graphicsQuality: 'auto'
      },
      lastSyncedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      devices: []
    };

    await this.saveCloudProfile(profile);
    await this.saveLocalProfile(profile);
    
    return profile;
  }

  private mergeProfiles(local: UserProfile | null, cloud: UserProfile | null): UserProfile {
    if (!local) return cloud!;
    if (!cloud) return local;
    
    // Use the most recent data
    const localTime = new Date(local.lastSyncedAt).getTime();
    const cloudTime = new Date(cloud.lastSyncedAt).getTime();
    
    if (cloudTime > localTime) {
      return cloud;
    } else {
      return local;
    }
  }

  // Sync Operations
  async syncProfile(): Promise<boolean> {
    if (this.syncStatus.isSyncing) return false;
    
    this.syncStatus.isSyncing = true;
    
    try {
      if (!this.currentProfile) return false;
      
      // Update last synced time
      this.currentProfile.lastSyncedAt = new Date().toISOString();
      
      // Save to cloud
      await this.saveCloudProfile(this.currentProfile);
      
      // Save locally
      await this.saveLocalProfile(this.currentProfile);
      
      // Process offline queue
      await this.processOfflineQueue();
      
      this.syncStatus.lastSyncTime = new Date().toISOString();
      this.syncStatus.syncErrors = [];
      
      return true;
    } catch (error: any) {
      this.syncStatus.syncErrors.push(error.message);
      
      // Queue for later if offline
      if (this.syncStatus.networkStatus === 'offline') {
        this.queueForSync(this.currentProfile);
      }
      
      return false;
    } finally {
      this.syncStatus.isSyncing = false;
    }
  }

  private async saveCloudProfile(profile: UserProfile) {
    if (this.syncStatus.networkStatus === 'offline') {
      this.queueForSync(profile);
      return;
    }
    
    await firestore
      .collection('users')
      .doc(profile.uid)
      .set(profile, { merge: true });
  }

  private async saveLocalProfile(profile: UserProfile) {
    await AsyncStorage.setItem(
      `profile_${profile.uid}`,
      JSON.stringify(profile)
    );
  }

  private startAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(() => {
      if (this.syncStatus.networkStatus === 'online') {
        this.syncProfile();
      }
    }, this.SYNC_INTERVAL);
  }

  private setupNetworkMonitoring() {
    NetInfo.addEventListener(state => {
      const wasOffline = this.syncStatus.networkStatus === 'offline';
      this.syncStatus.networkStatus = state.isConnected ? 'online' : 'offline';
      
      // Sync when coming back online
      if (wasOffline && state.isConnected) {
        this.processOfflineQueue();
        this.syncProfile();
      }
    });
  }

  private queueForSync(data: any) {
    this.offlineQueue.push({
      timestamp: Date.now(),
      data
    });
    this.syncStatus.pendingChanges = this.offlineQueue.length;
  }

  private async processOfflineQueue() {
    if (this.offlineQueue.length === 0) return;
    
    const queue = [...this.offlineQueue];
    this.offlineQueue = [];
    
    for (const item of queue) {
      try {
        await this.saveCloudProfile(item.data);
      } catch (error) {
        console.error('Failed to sync queued item:', error);
        this.offlineQueue.push(item);
      }
    }
    
    this.syncStatus.pendingChanges = this.offlineQueue.length;
  }

  // Device Registration
  private async registerDevice() {
    if (!this.currentProfile || !this.currentDevice) return;
    
    // Check if device already registered
    const deviceIndex = this.currentProfile.devices.findIndex(
      d => d.deviceId === this.currentDevice!.deviceId
    );
    
    if (deviceIndex >= 0) {
      // Update existing device info
      this.currentProfile.devices[deviceIndex] = this.currentDevice;
    } else {
      // Add new device
      this.currentProfile.devices.push(this.currentDevice);
    }
    
    // Limit to last 10 devices
    if (this.currentProfile.devices.length > 10) {
      this.currentProfile.devices = this.currentProfile.devices
        .sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime())
        .slice(0, 10);
    }
    
    await this.syncProfile();
  }

  // Update Methods
  async updateProfile(updates: Partial<UserProfile>) {
    if (!this.currentProfile) return;
    
    this.currentProfile = {
      ...this.currentProfile,
      ...updates,
      lastSyncedAt: new Date().toISOString()
    };
    
    await this.syncProfile();
  }

  async updateGameProgress(data: {
    coins?: number;
    experience?: number;
    highScore?: number;
    achievements?: string[];
    unlockedItems?: string[];
  }) {
    if (!this.currentProfile) return;
    
    if (data.coins !== undefined) {
      this.currentProfile.coins += data.coins;
    }
    
    if (data.experience !== undefined) {
      this.currentProfile.experience += data.experience;
      // Check for level up
      const requiredXP = this.currentProfile.level * 1000;
      if (this.currentProfile.experience >= requiredXP) {
        this.currentProfile.level++;
        this.currentProfile.experience -= requiredXP;
      }
    }
    
    if (data.highScore !== undefined && data.highScore > this.currentProfile.highScore) {
      this.currentProfile.highScore = data.highScore;
    }
    
    if (data.achievements) {
      this.currentProfile.achievements = [
        ...new Set([...this.currentProfile.achievements, ...data.achievements])
      ];
    }
    
    if (data.unlockedItems) {
      this.currentProfile.unlockedItems = [
        ...new Set([...this.currentProfile.unlockedItems, ...data.unlockedItems])
      ];
    }
    
    this.currentProfile.totalGamesPlayed++;
    
    await this.syncProfile();
  }

  async updateSettings(settings: Partial<UserSettings>) {
    if (!this.currentProfile) return;
    
    this.currentProfile.settings = {
      ...this.currentProfile.settings,
      ...settings
    };
    
    await this.syncProfile();
  }

  // Getters
  getProfile(): UserProfile | null {
    return this.currentProfile;
  }

  getDevice(): DeviceInfo | null {
    return this.currentDevice;
  }

  getSyncStatus(): SyncStatus {
    return this.syncStatus;
  }

  getGameSettings(): GameSettings | null {
    return this.currentDevice?.gameSettings || null;
  }

  isHighEndDevice(): boolean {
    return this.currentDevice?.graphicsQuality === 'high' || 
           this.currentDevice?.graphicsQuality === 'ultra';
  }

  // Cleanup
  cleanup() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Device-specific rendering hints
  getRenderingHints(): {
    useParticles: boolean;
    useShadows: boolean;
    targetFPS: number;
    textureQuality: string;
    enableBloom: boolean;
    enableReflections: boolean;
  } {
    const settings = this.currentDevice?.gameSettings;
    const isHighEnd = this.isHighEndDevice();
    
    return {
      useParticles: settings?.particleEffects ?? true,
      useShadows: settings?.shadowQuality !== 'off',
      targetFPS: settings?.targetFPS ?? 60,
      textureQuality: settings?.textureQuality ?? 'medium',
      enableBloom: isHighEnd,
      enableReflections: isHighEnd
    };
  }
}

export default new ProfileSyncSystem();