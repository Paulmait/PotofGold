import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import { eventBus } from '../core/EventBus';

interface QueueItem {
  id: string;
  type: 'firestore' | 'auth' | 'storage' | 'function';
  operation: string;
  payload: any;
  timestamp: number;
  retryCount: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingItems: number;
  lastSyncTime: number;
  failedItems: number;
}

export class OfflineQueueManager {
  private static instance: OfflineQueueManager;
  private queue: QueueItem[] = [];
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private maxRetries: number = 3;
  private syncInterval: NodeJS.Timeout | null = null;
  private networkListener: any = null;
  private status: SyncStatus;

  private constructor() {
    this.status = {
      isOnline: true,
      isSyncing: false,
      pendingItems: 0,
      lastSyncTime: Date.now(),
      failedItems: 0,
    };

    this.initializeQueue();
    this.setupNetworkListener();
    this.startSyncInterval();
  }

  static getInstance(): OfflineQueueManager {
    if (!OfflineQueueManager.instance) {
      OfflineQueueManager.instance = new OfflineQueueManager();
    }
    return OfflineQueueManager.instance;
  }

  private async initializeQueue(): Promise<void> {
    try {
      // Load persisted queue from storage
      const savedQueue = await AsyncStorage.getItem('offline_queue');
      if (savedQueue) {
        this.queue = JSON.parse(savedQueue);
        this.status.pendingItems = this.queue.length;
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }

  private setupNetworkListener(): void {
    this.networkListener = NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;
      this.status.isOnline = this.isOnline;

      if (wasOffline && this.isOnline) {
        console.log('Connection restored, syncing offline queue...');
        this.processQueue();
      }

      eventBus.emit('network:status', {
        isOnline: this.isOnline,
        type: state.type,
        details: state.details,
      });
    });
  }

  private startSyncInterval(): void {
    // Attempt to sync every 30 seconds
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.queue.length > 0 && !this.isSyncing) {
        this.processQueue();
      }
    }, 30000);
  }

  // Add item to queue
  async addToQueue(
    type: QueueItem['type'],
    operation: string,
    payload: any,
    priority: QueueItem['priority'] = 'normal'
  ): Promise<void> {
    const item: QueueItem = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      operation,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      priority,
    };

    // Add to queue based on priority
    if (priority === 'critical') {
      this.queue.unshift(item);
    } else {
      this.queue.push(item);
    }

    // Sort by priority
    this.queue.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    this.status.pendingItems = this.queue.length;

    // Persist queue
    await this.saveQueue();

    // Try to process immediately if online
    if (this.isOnline && !this.isSyncing) {
      this.processQueue();
    }

    eventBus.emit('queue:added', item);
  }

  // Process queue items
  private async processQueue(): Promise<void> {
    if (this.isSyncing || this.queue.length === 0 || !this.isOnline) return;

    this.isSyncing = true;
    this.status.isSyncing = true;
    eventBus.emit('sync:started', { items: this.queue.length });

    const processedItems: string[] = [];
    const failedItems: QueueItem[] = [];

    for (const item of [...this.queue]) {
      try {
        await this.processItem(item);
        processedItems.push(item.id);
      } catch (error) {
        console.error(`Failed to process queue item ${item.id}:`, error);

        item.retryCount++;

        if (item.retryCount >= this.maxRetries) {
          failedItems.push(item);
          eventBus.emit('queue:failed', { item, error });
        } else {
          // Keep in queue for retry
          eventBus.emit('queue:retry', { item, attempt: item.retryCount });
        }
      }
    }

    // Remove processed and permanently failed items
    this.queue = this.queue.filter(
      (item) => !processedItems.includes(item.id) && !failedItems.find((f) => f.id === item.id)
    );

    this.status.pendingItems = this.queue.length;
    this.status.failedItems = failedItems.length;
    this.status.lastSyncTime = Date.now();

    // Save updated queue
    await this.saveQueue();

    // Handle failed items
    if (failedItems.length > 0) {
      await this.handleFailedItems(failedItems);
    }

    this.isSyncing = false;
    this.status.isSyncing = false;

    eventBus.emit('sync:completed', {
      processed: processedItems.length,
      failed: failedItems.length,
      remaining: this.queue.length,
    });
  }

  // Process individual item
  private async processItem(item: QueueItem): Promise<void> {
    switch (item.type) {
      case 'firestore':
        await this.processFirestoreOperation(item);
        break;
      case 'auth':
        await this.processAuthOperation(item);
        break;
      case 'storage':
        await this.processStorageOperation(item);
        break;
      case 'function':
        await this.processFunctionCall(item);
        break;
      default:
        throw new Error(`Unknown operation type: ${item.type}`);
    }
  }

  private async processFirestoreOperation(item: QueueItem): Promise<void> {
    const { operation, payload } = item;

    // Import Firebase dynamically to avoid circular dependencies
    const { doc, setDoc, updateDoc, deleteDoc } = await import('firebase/firestore');
    const { db } = await import('../../firebase/firebase');

    switch (operation) {
      case 'set':
        await setDoc(doc(db, payload.path), payload.data);
        break;
      case 'update':
        await updateDoc(doc(db, payload.path), payload.data);
        break;
      case 'delete':
        await deleteDoc(doc(db, payload.path));
        break;
      default:
        throw new Error(`Unknown Firestore operation: ${operation}`);
    }
  }

  private async processAuthOperation(item: QueueItem): Promise<void> {
    const { operation, payload } = item;

    // Auth operations typically don't need offline queue
    // but keeping for completeness
    console.log('Processing auth operation:', operation, payload);
  }

  private async processStorageOperation(item: QueueItem): Promise<void> {
    const { operation, payload } = item;

    // Handle file uploads when back online
    if (operation === 'upload' && payload.file) {
      // Implementation for file upload
      console.log('Processing storage upload:', payload);
    }
  }

  private async processFunctionCall(item: QueueItem): Promise<void> {
    const { operation, payload } = item;

    // Call cloud functions when back online
    console.log('Processing function call:', operation, payload);
  }

  private async handleFailedItems(items: QueueItem[]): Promise<void> {
    // Save failed items for manual review or future retry
    try {
      const existingFailed = await AsyncStorage.getItem('failed_queue_items');
      const failed = existingFailed ? JSON.parse(existingFailed) : [];
      failed.push(...items);

      await AsyncStorage.setItem('failed_queue_items', JSON.stringify(failed));
    } catch (error) {
      console.error('Failed to save failed items:', error);
    }
  }

  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('offline_queue', JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save queue:', error);
    }
  }

  // Public API
  getStatus(): SyncStatus {
    return { ...this.status };
  }

  getPendingCount(): number {
    return this.queue.length;
  }

  clearQueue(): void {
    this.queue = [];
    this.status.pendingItems = 0;
    this.saveQueue();
  }

  async retryFailedItems(): Promise<void> {
    try {
      const failedItems = await AsyncStorage.getItem('failed_queue_items');
      if (failedItems) {
        const items = JSON.parse(failedItems);

        // Reset retry count and add back to queue
        for (const item of items) {
          item.retryCount = 0;
          await this.addToQueue(item.type, item.operation, item.payload, item.priority);
        }

        // Clear failed items
        await AsyncStorage.removeItem('failed_queue_items');
      }
    } catch (error) {
      console.error('Failed to retry items:', error);
    }
  }

  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    if (this.networkListener) {
      this.networkListener();
    }
  }
}

export const offlineQueueManager = OfflineQueueManager.getInstance();
