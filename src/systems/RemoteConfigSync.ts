/**
 * Remote Configuration Sync System
 * Handles syncing LiveOps config with backend and offline fallback
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import { liveOpsManager, LiveOpsConfig } from './LiveOpsManager';
import { telemetrySystem, EventType } from './TelemetrySystem';
import { crashReporting } from './CrashReporting';

export interface SyncStatus {
  lastSync: number;
  syncInProgress: boolean;
  failureCount: number;
  nextRetryTime: number;
  offlineMode: boolean;
}

export interface ConfigVersion {
  version: string;
  timestamp: number;
  checksum: string;
  environment: 'development' | 'preview' | 'production';
}

export interface RemoteConfigResponse {
  success: boolean;
  config?: LiveOpsConfig;
  version?: ConfigVersion;
  error?: string;
  retryAfter?: number;
}

class RemoteConfigSync {
  private static instance: RemoteConfigSync;
  
  private syncStatus: SyncStatus = {
    lastSync: 0,
    syncInProgress: false,
    failureCount: 0,
    nextRetryTime: 0,
    offlineMode: false
  };
  
  private syncInterval: NodeJS.Timeout | null = null;
  private retryTimeout: NodeJS.Timeout | null = null;
  private networkListener: any = null;
  
  // Configuration
  private readonly CONFIG_ENDPOINTS = {
    development: 'https://dev-api.potofgold.app/liveops/config',
    preview: 'https://preview-api.potofgold.app/liveops/config',
    production: 'https://api.potofgold.app/liveops/config'
  };
  
  private readonly SYNC_INTERVALS = {
    development: 60 * 1000,        // 1 minute
    preview: 5 * 60 * 1000,         // 5 minutes
    production: 15 * 60 * 1000      // 15 minutes
  };
  
  private readonly MAX_RETRY_ATTEMPTS = 5;
  private readonly RETRY_DELAYS = [1000, 5000, 15000, 60000, 300000]; // Progressive backoff
  private readonly OFFLINE_CACHE_KEY = '@remote_config_offline';
  private readonly SYNC_STATUS_KEY = '@remote_config_sync_status';
  
  private constructor() {
    this.initialize();
  }
  
  static getInstance(): RemoteConfigSync {
    if (!RemoteConfigSync.instance) {
      RemoteConfigSync.instance = new RemoteConfigSync();
    }
    return RemoteConfigSync.instance;
  }
  
  private async initialize(): Promise<void> {
    try {
      // Load sync status
      await this.loadSyncStatus();
      
      // Setup network monitoring
      this.setupNetworkMonitoring();
      
      // Initial sync
      await this.syncConfig();
      
      // Start periodic sync
      this.startPeriodicSync();
      
      // Track initialization
      telemetrySystem.track(EventType.SESSION_START, {
        remote_config_sync: 'initialized',
        offline_mode: this.syncStatus.offlineMode
      });
      
    } catch (error) {
      console.error('Failed to initialize RemoteConfigSync:', error);
      crashReporting.recordError(error as Error, 'RemoteConfigSync.initialize');
    }
  }
  
  private async loadSyncStatus(): Promise<void> {
    try {
      const status = await AsyncStorage.getItem(this.SYNC_STATUS_KEY);
      if (status) {
        this.syncStatus = { ...this.syncStatus, ...JSON.parse(status) };
      }
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  }
  
  private async saveSyncStatus(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.SYNC_STATUS_KEY,
        JSON.stringify(this.syncStatus)
      );
    } catch (error) {
      console.error('Failed to save sync status:', error);
    }
  }
  
  private setupNetworkMonitoring(): void {
    this.networkListener = NetInfo.addEventListener(state => {
      const wasOffline = this.syncStatus.offlineMode;
      this.syncStatus.offlineMode = !state.isConnected;
      
      // Trigger sync when coming back online
      if (wasOffline && !this.syncStatus.offlineMode) {
        console.log('Network restored, syncing config...');
        this.syncConfig();
      }
      
      // Track network changes
      telemetrySystem.track(EventType.SESSION_START, {
        network_status: state.isConnected ? 'online' : 'offline',
        network_type: state.type
      });
    });
  }
  
  private getEnvironment(): 'development' | 'preview' | 'production' {
    if (__DEV__) return 'development';
    
    // Check for preview/beta builds
    const appVersion = require('../../package.json').version;
    if (appVersion.includes('beta') || appVersion.includes('preview')) {
      return 'preview';
    }
    
    return 'production';
  }
  
  private async fetchRemoteConfig(): Promise<RemoteConfigResponse> {
    const environment = this.getEnvironment();
    const endpoint = this.CONFIG_ENDPOINTS[environment];
    
    try {
      // Build request headers
      const headers: any = {
        'Content-Type': 'application/json',
        'X-App-Version': require('../../package.json').version,
        'X-Platform': Platform.OS,
        'X-Platform-Version': Platform.Version,
        'X-Environment': environment
      };
      
      // Add user context for personalization
      const userId = await AsyncStorage.getItem('@user_id');
      if (userId) {
        headers['X-User-Id'] = userId;
      }
      
      // Add device context
      const deviceInfo = await AsyncStorage.getItem('@device_info');
      if (deviceInfo) {
        headers['X-Device-Info'] = deviceInfo;
      }
      
      // Make request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
          return {
            success: false,
            error: 'Rate limited',
            retryAfter: retryAfter * 1000
          };
        }
        
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
      
      const data = await response.json();
      
      // Validate response
      if (!this.validateConfig(data.config)) {
        return {
          success: false,
          error: 'Invalid config structure'
        };
      }
      
      return {
        success: true,
        config: data.config,
        version: data.version
      };
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'Request timeout' };
      }
      
      return {
        success: false,
        error: error.message || 'Network error'
      };
    }
  }
  
  private validateConfig(config: any): config is LiveOpsConfig {
    // Basic structure validation
    if (!config || typeof config !== 'object') return false;
    
    const requiredFields = ['features', 'balancing', 'monetization', 'events', 'messages'];
    for (const field of requiredFields) {
      if (!(field in config)) {
        console.error(`Missing required field: ${field}`);
        return false;
      }
    }
    
    // Validate features
    if (typeof config.features !== 'object') return false;
    
    // Validate balancing
    if (typeof config.balancing !== 'object') return false;
    
    // Additional type checking can be added here
    
    return true;
  }
  
  async syncConfig(): Promise<boolean> {
    // Check if already syncing
    if (this.syncStatus.syncInProgress) {
      console.log('Sync already in progress');
      return false;
    }
    
    // Check if in offline mode
    if (this.syncStatus.offlineMode) {
      console.log('Offline mode, using cached config');
      await this.loadOfflineConfig();
      return false;
    }
    
    // Check retry timing
    if (Date.now() < this.syncStatus.nextRetryTime) {
      console.log('Waiting for retry window');
      return false;
    }
    
    this.syncStatus.syncInProgress = true;
    
    try {
      console.log('Syncing remote config...');
      
      // Fetch remote config
      const response = await this.fetchRemoteConfig();
      
      if (response.success && response.config) {
        // Update LiveOps manager
        await liveOpsManager.overrideConfig(response.config);
        
        // Save for offline use
        await this.saveOfflineConfig(response.config, response.version);
        
        // Update sync status
        this.syncStatus.lastSync = Date.now();
        this.syncStatus.failureCount = 0;
        this.syncStatus.nextRetryTime = 0;
        
        // Track successful sync
        telemetrySystem.track(EventType.SESSION_START, {
          config_sync: 'success',
          config_version: response.version?.version || 'unknown'
        });
        
        console.log('Config sync successful');
        return true;
        
      } else {
        // Handle failure
        this.syncStatus.failureCount++;
        
        // Calculate retry delay
        const retryDelay = response.retryAfter || 
          this.RETRY_DELAYS[Math.min(this.syncStatus.failureCount - 1, this.RETRY_DELAYS.length - 1)];
        
        this.syncStatus.nextRetryTime = Date.now() + retryDelay;
        
        // Schedule retry
        this.scheduleRetry(retryDelay);
        
        // Track failure
        telemetrySystem.track(EventType.SESSION_END, {
          config_sync: 'failed',
          error: response.error,
          failure_count: this.syncStatus.failureCount
        });
        
        console.error('Config sync failed:', response.error);
        
        // Fall back to offline config after multiple failures
        if (this.syncStatus.failureCount >= this.MAX_RETRY_ATTEMPTS) {
          await this.loadOfflineConfig();
        }
        
        return false;
      }
      
    } catch (error) {
      console.error('Sync error:', error);
      crashReporting.recordError(error as Error, 'RemoteConfigSync.syncConfig');
      
      this.syncStatus.failureCount++;
      
      // Fall back to offline config
      await this.loadOfflineConfig();
      
      return false;
      
    } finally {
      this.syncStatus.syncInProgress = false;
      await this.saveSyncStatus();
    }
  }
  
  private async saveOfflineConfig(
    config: LiveOpsConfig,
    version?: ConfigVersion
  ): Promise<void> {
    try {
      const offlineData = {
        config,
        version: version || {
          version: 'offline',
          timestamp: Date.now(),
          checksum: '',
          environment: this.getEnvironment()
        },
        savedAt: Date.now()
      };
      
      await AsyncStorage.setItem(
        this.OFFLINE_CACHE_KEY,
        JSON.stringify(offlineData)
      );
      
      console.log('Offline config saved');
      
    } catch (error) {
      console.error('Failed to save offline config:', error);
    }
  }
  
  private async loadOfflineConfig(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.OFFLINE_CACHE_KEY);
      
      if (data) {
        const offlineData = JSON.parse(data);
        
        // Check age of offline config (max 7 days)
        const maxAge = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - offlineData.savedAt > maxAge) {
          console.warn('Offline config too old, using defaults');
          return;
        }
        
        // Apply offline config
        await liveOpsManager.overrideConfig(offlineData.config);
        
        console.log('Loaded offline config from', new Date(offlineData.savedAt).toISOString());
        
        // Track offline config usage
        telemetrySystem.track(EventType.SESSION_START, {
          config_source: 'offline',
          config_age_hours: Math.round((Date.now() - offlineData.savedAt) / (60 * 60 * 1000))
        });
      }
      
    } catch (error) {
      console.error('Failed to load offline config:', error);
    }
  }
  
  private startPeriodicSync(): void {
    const environment = this.getEnvironment();
    const interval = this.SYNC_INTERVALS[environment];
    
    // Clear existing interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    // Start new interval
    this.syncInterval = setInterval(() => {
      this.syncConfig();
    }, interval);
    
    console.log(`Started periodic sync (${interval / 1000}s interval)`);
  }
  
  private scheduleRetry(delay: number): void {
    // Clear existing retry
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    
    // Schedule new retry
    this.retryTimeout = setTimeout(() => {
      console.log('Retrying config sync...');
      this.syncConfig();
    }, delay);
    
    console.log(`Scheduled retry in ${delay / 1000}s`);
  }
  
  // Public API
  
  async forceSync(): Promise<boolean> {
    // Reset failure count for manual sync
    this.syncStatus.failureCount = 0;
    this.syncStatus.nextRetryTime = 0;
    
    return this.syncConfig();
  }
  
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }
  
  isOffline(): boolean {
    return this.syncStatus.offlineMode;
  }
  
  getLastSyncTime(): number {
    return this.syncStatus.lastSync;
  }
  
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.OFFLINE_CACHE_KEY);
      await AsyncStorage.removeItem(this.SYNC_STATUS_KEY);
      
      this.syncStatus = {
        lastSync: 0,
        syncInProgress: false,
        failureCount: 0,
        nextRetryTime: 0,
        offlineMode: false
      };
      
      console.log('Config cache cleared');
      
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }
  
  // Cleanup
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    
    if (this.networkListener) {
      this.networkListener();
    }
  }
}

// Export singleton instance
export const remoteConfigSync = RemoteConfigSync.getInstance();

// Export convenience functions
export async function syncRemoteConfig(): Promise<boolean> {
  return remoteConfigSync.forceSync();
}

export function getConfigSyncStatus(): SyncStatus {
  return remoteConfigSync.getSyncStatus();
}

export function isConfigOffline(): boolean {
  return remoteConfigSync.isOffline();
}