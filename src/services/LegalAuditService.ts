import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../../firebase/firebase';
import { collection, doc, setDoc, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

interface LegalAcceptanceRecord {
  userId?: string;
  deviceId: string;
  timestamp: string;
  acceptanceType: 'initial' | 'update' | 'purchase' | 'reminder';
  documentsAccepted: {
    termsOfService: boolean;
    privacyPolicy: boolean;
    eula: boolean;
  };
  legalVersion: string;
  ipAddress?: string;
  userAgent?: string;
  scrolledDocuments: boolean;
  timeSpentReading: number;
  purchaseContext?: {
    amount: string;
    itemType: string;
    itemId: string;
  };
}

interface DisclaimerAcceptance {
  userId?: string;
  timestamp: string;
  type: 'purchase' | 'reminder';
  accepted: boolean;
  purchaseAmount?: string;
  itemDetails?: any;
}

class LegalAuditService {
  private static instance: LegalAuditService;
  private auditQueue: any[] = [];
  private isOnline: boolean = true;

  private constructor() {
    this.setupNetworkListener();
    this.processQueuePeriodically();
  }

  static getInstance(): LegalAuditService {
    if (!LegalAuditService.instance) {
      LegalAuditService.instance = new LegalAuditService();
    }
    return LegalAuditService.instance;
  }

  private setupNetworkListener() {
    // Listen for network changes
    // In production, use NetInfo from @react-native-community/netinfo
  }

  private async processQueuePeriodically() {
    setInterval(async () => {
      if (this.isOnline && this.auditQueue.length > 0) {
        await this.flushQueue();
      }
    }, 30000); // Every 30 seconds
  }

  private async flushQueue() {
    const itemsToProcess = [...this.auditQueue];
    this.auditQueue = [];

    for (const item of itemsToProcess) {
      try {
        await this.saveToFirebase(item);
      } catch (error) {
        console.error('Failed to save audit record:', error);
        // Re-add to queue if failed
        this.auditQueue.push(item);
      }
    }
  }

  private async saveToFirebase(record: any) {
    try {
      // Add additional metadata for legal compliance
      const enhancedRecord = {
        ...record,
        serverTimestamp: serverTimestamp(),
        clientTimestamp: new Date().toISOString(),
        appVersion: '1.0.0',
        platform: 'mobile',
        // Add user agent and IP in production
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'React Native',
      };

      if (!auth.currentUser) {
        // Save to anonymous collection if not authenticated
        const anonymousRef = collection(db, 'legal_audit_anonymous');
        const docRef = await addDoc(anonymousRef, enhancedRecord);
        
        // Store reference for later linking
        await AsyncStorage.setItem('anonymous_legal_doc_id', docRef.id);
      } else {
        // Save to user-specific collection
        const userAuditRef = collection(db, 'legal_audit');
        await addDoc(userAuditRef, {
          ...enhancedRecord,
          userId: auth.currentUser.uid,
          userEmail: auth.currentUser.email,
        });
        
        // Link anonymous acceptance if exists
        const anonDocId = await AsyncStorage.getItem('anonymous_legal_doc_id');
        if (anonDocId) {
          const anonDocRef = doc(db, 'legal_audit_anonymous', anonDocId);
          await setDoc(anonDocRef, { linkedUserId: auth.currentUser.uid }, { merge: true });
          await AsyncStorage.removeItem('anonymous_legal_doc_id');
        }
      }
    } catch (error) {
      console.error('Failed to save to Firebase:', error);
      throw error;
    }
  }

  async recordInitialAcceptance(
    documentsAccepted: { termsOfService: boolean; privacyPolicy: boolean; eula: boolean },
    timeSpentReading: number
  ): Promise<void> {
    const deviceId = await this.getDeviceId();
    const record: LegalAcceptanceRecord = {
      userId: auth.currentUser?.uid,
      deviceId,
      timestamp: new Date().toISOString(),
      acceptanceType: 'initial',
      documentsAccepted,
      legalVersion: '2.0',
      scrolledDocuments: true,
      timeSpentReading,
    };

    // Save locally
    await this.saveLocally('initial_acceptance', record);

    // Queue for Firebase
    this.auditQueue.push(record);

    // Try to flush immediately
    if (this.isOnline) {
      await this.flushQueue();
    }
  }

  async recordUpdateAcceptance(
    documentsAccepted: { termsOfService: boolean; privacyPolicy: boolean; eula: boolean },
    timeSpentReading: number
  ): Promise<void> {
    const deviceId = await this.getDeviceId();
    const record: LegalAcceptanceRecord = {
      userId: auth.currentUser?.uid,
      deviceId,
      timestamp: new Date().toISOString(),
      acceptanceType: 'update',
      documentsAccepted,
      legalVersion: '2.0',
      scrolledDocuments: true,
      timeSpentReading,
    };

    await this.saveLocally('update_acceptance', record);
    this.auditQueue.push(record);

    if (this.isOnline) {
      await this.flushQueue();
    }
  }

  async recordPurchaseDisclaimer(
    accepted: boolean,
    purchaseAmount?: string,
    itemDetails?: any
  ): Promise<void> {
    const record: DisclaimerAcceptance = {
      userId: auth.currentUser?.uid,
      timestamp: new Date().toISOString(),
      type: 'purchase',
      accepted,
      purchaseAmount,
      itemDetails,
    };

    await this.saveLocally('purchase_disclaimer', record);
    this.auditQueue.push({
      type: 'disclaimer',
      ...record,
    });

    if (this.isOnline) {
      await this.flushQueue();
    }
  }

  async recordReminderDisclaimer(accepted: boolean): Promise<void> {
    const record: DisclaimerAcceptance = {
      userId: auth.currentUser?.uid,
      timestamp: new Date().toISOString(),
      type: 'reminder',
      accepted,
    };

    await this.saveLocally('reminder_disclaimer', record);
    this.auditQueue.push({
      type: 'disclaimer',
      ...record,
    });

    if (this.isOnline) {
      await this.flushQueue();
    }
  }

  private async saveLocally(key: string, data: any): Promise<void> {
    try {
      const existingData = await AsyncStorage.getItem(`legal_audit_${key}`);
      const records = existingData ? JSON.parse(existingData) : [];
      records.push(data);

      // Keep only last 50 records locally
      if (records.length > 50) {
        records.splice(0, records.length - 50);
      }

      await AsyncStorage.setItem(`legal_audit_${key}`, JSON.stringify(records));
    } catch (error) {
      console.error('Failed to save audit record locally:', error);
    }
  }

  private async getDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem('device_id');
      if (!deviceId) {
        // Generate a unique device ID
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('device_id', deviceId);
      }
      return deviceId;
    } catch (error) {
      return `temp_${Date.now()}`;
    }
  }

  async getAcceptanceHistory(): Promise<any[]> {
    const history = [];
    
    try {
      // Get all local audit records
      const keys = [
        'legal_audit_initial_acceptance',
        'legal_audit_update_acceptance',
        'legal_audit_purchase_disclaimer',
        'legal_audit_reminder_disclaimer',
      ];

      for (const key of keys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const records = JSON.parse(data);
          history.push(...records);
        }
      }

      // Sort by timestamp
      history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Failed to get acceptance history:', error);
    }

    return history;
  }

  async verifyUserAcceptance(): Promise<{
    hasAccepted: boolean;
    acceptanceDate?: string;
    version?: string;
  }> {
    try {
      const initialAcceptance = await AsyncStorage.getItem('legal_audit_initial_acceptance');
      const updateAcceptance = await AsyncStorage.getItem('legal_audit_update_acceptance');

      let latestAcceptance = null;

      if (initialAcceptance) {
        const records = JSON.parse(initialAcceptance);
        if (records.length > 0) {
          latestAcceptance = records[records.length - 1];
        }
      }

      if (updateAcceptance) {
        const records = JSON.parse(updateAcceptance);
        if (records.length > 0) {
          const latest = records[records.length - 1];
          if (!latestAcceptance || new Date(latest.timestamp) > new Date(latestAcceptance.timestamp)) {
            latestAcceptance = latest;
          }
        }
      }

      if (latestAcceptance) {
        return {
          hasAccepted: true,
          acceptanceDate: latestAcceptance.timestamp,
          version: latestAcceptance.legalVersion,
        };
      }

      return { hasAccepted: false };
    } catch (error) {
      console.error('Failed to verify user acceptance:', error);
      return { hasAccepted: false };
    }
  }

  async exportAuditLog(): Promise<string> {
    const history = await this.getAcceptanceHistory();
    return JSON.stringify(history, null, 2);
  }

  async clearLocalAuditLog(): Promise<void> {
    const keys = [
      'legal_audit_initial_acceptance',
      'legal_audit_update_acceptance',
      'legal_audit_purchase_disclaimer',
      'legal_audit_reminder_disclaimer',
    ];

    for (const key of keys) {
      await AsyncStorage.removeItem(key);
    }
  }
}

export default LegalAuditService.getInstance();