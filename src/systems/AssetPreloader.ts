import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import { eventBus } from '../core/EventBus';

export interface AssetManifest {
  version: string;
  assets: AssetEntry[];
  bundles: AssetBundle[];
}

export interface AssetEntry {
  id: string;
  url: string;
  type: AssetType;
  size: number;
  priority: AssetPriority;
  bundle?: string;
  dependencies?: string[];
  hash?: string;
  compressed?: boolean;
}

export interface AssetBundle {
  id: string;
  name: string;
  assets: string[];
  priority: AssetPriority;
  loadCondition?: LoadCondition;
}

export enum AssetType {
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  JSON = 'json',
  FONT = 'font',
  ANIMATION = 'animation',
}

export enum AssetPriority {
  CRITICAL = 0, // Load immediately
  HIGH = 1, // Load after critical
  MEDIUM = 2, // Load when idle
  LOW = 3, // Load on demand
  LAZY = 4, // Load when needed
}

export interface LoadCondition {
  type: 'screen' | 'level' | 'event' | 'time';
  value: string | number;
}

export interface LoadProgress {
  loaded: number;
  total: number;
  percentage: number;
  currentAsset?: string;
  timeRemaining?: number;
}

export interface AssetCache {
  [key: string]: {
    data: any;
    type: AssetType;
    size: number;
    lastAccessed: number;
    refCount: number;
  };
}

export class AssetPreloader {
  private static instance: AssetPreloader;
  private manifest: AssetManifest | null = null;
  private cache: AssetCache = {};
  private loadQueue: AssetEntry[] = [];
  private isLoading = false;
  private loadedAssets: Set<string> = new Set();
  private failedAssets: Map<string, number> = new Map();
  private maxRetries = 3;
  private maxCacheSize = 100 * 1024 * 1024; // 100MB
  private currentCacheSize = 0;
  private loadStartTime = 0;
  private bytesLoaded = 0;
  private totalBytes = 0;
  private placeholders: Map<AssetType, any> = new Map();
  private downloadTasks: Map<string, FileSystem.DownloadResumable> = new Map();
  private priorityQueues: Map<AssetPriority, AssetEntry[]> = new Map();

  private constructor() {
    this.initializePlaceholders();
    this.initializePriorityQueues();
    this.setupCacheDirectory();
  }

  static getInstance(): AssetPreloader {
    if (!AssetPreloader.instance) {
      AssetPreloader.instance = new AssetPreloader();
    }
    return AssetPreloader.instance;
  }

  private initializePlaceholders() {
    // Set default placeholders for each asset type
    this.placeholders.set(AssetType.IMAGE, require('../../assets/images/pot_of_gold_icon.png'));
    this.placeholders.set(AssetType.AUDIO, null);
    this.placeholders.set(AssetType.JSON, {});
  }

  private initializePriorityQueues() {
    Object.values(AssetPriority).forEach((priority) => {
      if (typeof priority === 'number') {
        this.priorityQueues.set(priority, []);
      }
    });
  }

  private async setupCacheDirectory() {
    const cacheDir = `${FileSystem.cacheDirectory}assets/`;
    const dirInfo = await FileSystem.getInfoAsync(cacheDir);

    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
    }
  }

  async loadManifest(manifestUrl: string): Promise<void> {
    try {
      const response = await fetch(manifestUrl);
      this.manifest = await response.json();

      // Calculate total size
      this.totalBytes = this.manifest!.assets.reduce((sum, asset) => sum + asset.size, 0);

      // Organize assets by priority
      this.organizeAssetsByPriority();

      eventBus.emit('assets:manifest:loaded', {
        version: this.manifest!.version,
        assetCount: this.manifest!.assets.length,
        totalSize: this.totalBytes,
      });
    } catch (error) {
      console.error('Failed to load asset manifest:', error);
      // Use fallback manifest
      this.loadFallbackManifest();
    }
  }

  private organizeAssetsByPriority() {
    if (!this.manifest) return;

    this.manifest.assets.forEach((asset) => {
      const queue = this.priorityQueues.get(asset.priority);
      if (queue) {
        queue.push(asset);
      }
    });
  }

  async preloadCriticalAssets(): Promise<void> {
    const criticalAssets = this.priorityQueues.get(AssetPriority.CRITICAL) || [];

    if (criticalAssets.length === 0) {
      console.log('No critical assets to preload');
      return;
    }

    this.loadStartTime = Date.now();

    // Load critical assets sequentially to ensure they're available
    for (const asset of criticalAssets) {
      await this.loadAsset(asset, true);
    }

    eventBus.emit('assets:critical:loaded', {
      count: criticalAssets.length,
      duration: Date.now() - this.loadStartTime,
    });
  }

  async preloadBundle(bundleId: string): Promise<void> {
    if (!this.manifest) return;

    const bundle = this.manifest.bundles.find((b) => b.id === bundleId);
    if (!bundle) {
      console.error(`Bundle ${bundleId} not found`);
      return;
    }

    const assets = this.manifest.assets.filter((a) => bundle.assets.includes(a.id));

    // Load bundle assets in parallel
    await Promise.all(assets.map((asset) => this.loadAsset(asset)));

    eventBus.emit('assets:bundle:loaded', {
      bundleId,
      assetCount: assets.length,
    });
  }

  async loadAsset(asset: AssetEntry, immediate = false): Promise<any> {
    // Check if already loaded
    if (this.cache[asset.id]) {
      this.cache[asset.id].lastAccessed = Date.now();
      this.cache[asset.id].refCount++;
      return this.cache[asset.id].data;
    }

    // Check if already in queue
    if (!immediate && this.loadQueue.find((a) => a.id === asset.id)) {
      return this.getPlaceholder(asset.type);
    }

    if (immediate) {
      return await this.loadAssetImmediately(asset);
    } else {
      this.addToQueue(asset);
      this.processQueue();
      return this.getPlaceholder(asset.type);
    }
  }

  private async loadAssetImmediately(asset: AssetEntry): Promise<any> {
    try {
      const data = await this.downloadAsset(asset);
      this.cacheAsset(asset.id, data, asset.type, asset.size);
      this.loadedAssets.add(asset.id);

      eventBus.emit('asset:loaded', {
        id: asset.id,
        type: asset.type,
        size: asset.size,
      });

      return data;
    } catch (error) {
      console.error(`Failed to load asset ${asset.id}:`, error);
      return this.handleLoadError(asset);
    }
  }

  private async downloadAsset(asset: AssetEntry): Promise<any> {
    const cacheUri = `${FileSystem.cacheDirectory}assets/${asset.id}`;

    // Check if cached locally
    const fileInfo = await FileSystem.getInfoAsync(cacheUri);
    if (fileInfo.exists) {
      return await this.loadFromCache(cacheUri, asset.type);
    }

    // Download asset
    switch (asset.type) {
      case AssetType.IMAGE:
        return await this.downloadImage(asset);
      case AssetType.AUDIO:
        return await this.downloadAudio(asset);
      case AssetType.JSON:
        return await this.downloadJSON(asset);
      default:
        return await this.downloadGeneric(asset);
    }
  }

  private async downloadImage(asset: AssetEntry): Promise<any> {
    const cacheUri = `${FileSystem.cacheDirectory}assets/${asset.id}`;

    // Use resumable download for large images
    const downloadResumable = FileSystem.createDownloadResumable(
      asset.url,
      cacheUri,
      {},
      (downloadProgress) => {
        this.updateProgress(asset.id, downloadProgress);
      }
    );

    this.downloadTasks.set(asset.id, downloadResumable);

    try {
      const result = await downloadResumable.downloadAsync();
      if (result) {
        await Image.prefetch(result.uri);
        return result.uri;
      }
    } finally {
      this.downloadTasks.delete(asset.id);
    }
  }

  private async downloadAudio(asset: AssetEntry): Promise<any> {
    const { sound } = await Audio.Sound.createAsync(
      { uri: asset.url },
      { shouldPlay: false },
      null,
      true
    );
    return sound;
  }

  private async downloadJSON(asset: AssetEntry): Promise<any> {
    const response = await fetch(asset.url);
    return await response.json();
  }

  private async downloadGeneric(asset: AssetEntry): Promise<any> {
    const cacheUri = `${FileSystem.cacheDirectory}assets/${asset.id}`;

    await FileSystem.downloadAsync(asset.url, cacheUri);
    return cacheUri;
  }

  private async loadFromCache(uri: string, type: AssetType): Promise<any> {
    switch (type) {
      case AssetType.IMAGE:
        await Image.prefetch(uri);
        return uri;
      case AssetType.JSON:
        const content = await FileSystem.readAsStringAsync(uri);
        return JSON.parse(content);
      default:
        return uri;
    }
  }

  private updateProgress(assetId: string, downloadProgress: FileSystem.DownloadProgressData) {
    const progress =
      downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;

    this.bytesLoaded += downloadProgress.totalBytesWritten;

    const overallProgress: LoadProgress = {
      loaded: this.bytesLoaded,
      total: this.totalBytes,
      percentage: (this.bytesLoaded / this.totalBytes) * 100,
      currentAsset: assetId,
      timeRemaining: this.estimateTimeRemaining(),
    };

    eventBus.emit('assets:progress', overallProgress);
  }

  private estimateTimeRemaining(): number {
    if (this.bytesLoaded === 0) return 0;

    const elapsed = Date.now() - this.loadStartTime;
    const bytesPerMs = this.bytesLoaded / elapsed;
    const remainingBytes = this.totalBytes - this.bytesLoaded;

    return Math.round(remainingBytes / bytesPerMs / 1000); // seconds
  }

  private cacheAsset(id: string, data: any, type: AssetType, size: number) {
    // Check cache size limit
    if (this.currentCacheSize + size > this.maxCacheSize) {
      this.evictLRU(size);
    }

    this.cache[id] = {
      data,
      type,
      size,
      lastAccessed: Date.now(),
      refCount: 1,
    };

    this.currentCacheSize += size;
  }

  private evictLRU(requiredSize: number) {
    const entries = Object.entries(this.cache)
      .filter(([_, value]) => value.refCount === 0)
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    let freedSize = 0;
    for (const [id, asset] of entries) {
      if (freedSize >= requiredSize) break;

      freedSize += asset.size;
      this.currentCacheSize -= asset.size;
      delete this.cache[id];

      // Also remove from disk cache if needed
      this.removeFromDiskCache(id);
    }
  }

  private async removeFromDiskCache(assetId: string) {
    const cacheUri = `${FileSystem.cacheDirectory}assets/${assetId}`;
    try {
      await FileSystem.deleteAsync(cacheUri, { idempotent: true });
    } catch (error) {
      console.error(`Failed to remove ${assetId} from disk cache:`, error);
    }
  }

  private addToQueue(asset: AssetEntry) {
    if (!this.loadQueue.find((a) => a.id === asset.id)) {
      this.loadQueue.push(asset);
      this.loadQueue.sort((a, b) => a.priority - b.priority);
    }
  }

  private async processQueue() {
    if (this.isLoading || this.loadQueue.length === 0) return;

    this.isLoading = true;

    while (this.loadQueue.length > 0) {
      const asset = this.loadQueue.shift()!;

      try {
        await this.loadAssetImmediately(asset);
      } catch (error) {
        console.error(`Failed to load queued asset ${asset.id}:`, error);
      }

      // Small delay between loads to prevent blocking
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    this.isLoading = false;
  }

  private handleLoadError(asset: AssetEntry): any {
    const retries = this.failedAssets.get(asset.id) || 0;

    if (retries < this.maxRetries) {
      this.failedAssets.set(asset.id, retries + 1);

      // Retry after delay
      setTimeout(
        () => {
          this.loadAsset(asset);
        },
        1000 * Math.pow(2, retries)
      ); // Exponential backoff
    }

    return this.getPlaceholder(asset.type);
  }

  private getPlaceholder(type: AssetType): any {
    return this.placeholders.get(type) || null;
  }

  private loadFallbackManifest() {
    // Load a minimal fallback manifest with essential assets
    this.manifest = {
      version: '1.0.0',
      assets: [
        {
          id: 'main_bg',
          url: '../../assets/images/pot_of_gold_splash.png',
          type: AssetType.IMAGE,
          size: 50000,
          priority: AssetPriority.CRITICAL,
        },
        {
          id: 'cart',
          url: '../../assets/images/mine_cart.png',
          type: AssetType.IMAGE,
          size: 10000,
          priority: AssetPriority.CRITICAL,
        },
      ],
      bundles: [],
    };
  }

  // Progressive loading methods
  async startProgressiveLoad() {
    // Load assets by priority
    for (const [priority, assets] of this.priorityQueues.entries()) {
      if (priority === AssetPriority.CRITICAL) continue; // Already loaded

      for (const asset of assets) {
        if (priority === AssetPriority.LAZY) break; // Don't preload lazy assets

        await this.loadAsset(asset);

        // Yield to prevent blocking
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    eventBus.emit('assets:all:loaded', {
      totalAssets: this.loadedAssets.size,
      cacheSize: this.currentCacheSize,
    });
  }

  // Public methods
  getAsset(id: string): any {
    const cached = this.cache[id];
    if (cached) {
      cached.lastAccessed = Date.now();
      return cached.data;
    }

    // Try to load if in manifest
    const asset = this.manifest?.assets.find((a) => a.id === id);
    if (asset) {
      this.loadAsset(asset);
      return this.getPlaceholder(asset.type);
    }

    return null;
  }

  releaseAsset(id: string) {
    const cached = this.cache[id];
    if (cached) {
      cached.refCount = Math.max(0, cached.refCount - 1);
    }
  }

  pauseDownloads() {
    this.downloadTasks.forEach((task) => {
      task.pauseAsync();
    });
  }

  resumeDownloads() {
    this.downloadTasks.forEach((task) => {
      task.resumeAsync();
    });
  }

  clearCache() {
    this.cache = {};
    this.currentCacheSize = 0;
    this.loadedAssets.clear();
  }

  getCacheInfo() {
    return {
      size: this.currentCacheSize,
      maxSize: this.maxCacheSize,
      assetCount: Object.keys(this.cache).length,
      usage: (this.currentCacheSize / this.maxCacheSize) * 100,
    };
  }

  preloadScreen(screenName: string) {
    if (!this.manifest) return;

    const bundle = this.manifest.bundles.find(
      (b) => b.loadCondition?.type === 'screen' && b.loadCondition.value === screenName
    );

    if (bundle) {
      this.preloadBundle(bundle.id);
    }
  }

  // Add missing method for tests
  getLoadedAssets(): Set<string> {
    return new Set(this.loadedAssets);
  }
}

export const assetPreloader = AssetPreloader.getInstance();
