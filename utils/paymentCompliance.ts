import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { Alert, Platform } from 'react-native';

export interface Subscription {
  id: string;
  productId: string;
  userId: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending_cancellation';
  startDate: string;
  endDate: string;
  nextBillingDate?: string;
  amount: number;
  currency: string;
  cancellationDate?: string;
  cancellationReason?: string;
  autoRenew: boolean;
  platform: 'ios' | 'android';
}

export interface Transaction {
  id: string;
  userId: string;
  productId: string;
  amount: number;
  currency: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'disputed';
  receiptData?: string;
  refundReason?: string;
  refundDate?: string;
  parentalConsent?: boolean;
  ageVerified?: boolean;
}

export interface RefundRequest {
  transactionId: string;
  reason: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
  processedDate?: string;
  refundAmount?: number;
}

export class PaymentComplianceSystem {
  private static instance: PaymentComplianceSystem;
  private readonly COOLING_OFF_PERIOD = 14 * 24 * 60 * 60 * 1000; // 14 days in MS
  private readonly MINOR_AGE_LIMIT = 13; // COPPA compliance
  private readonly SPENDING_LIMITS = {
    daily: 99.99,
    weekly: 299.99,
    monthly: 999.99,
    minor_daily: 4.99,
    minor_weekly: 9.99,
    minor_monthly: 19.99,
  };

  static getInstance(): PaymentComplianceSystem {
    if (!PaymentComplianceSystem.instance) {
      PaymentComplianceSystem.instance = new PaymentComplianceSystem();
    }
    return PaymentComplianceSystem.instance;
  }

  // =============== SUBSCRIPTION MANAGEMENT ===============

  async createSubscription(
    productId: string,
    userId: string,
    amount: number
  ): Promise<Subscription> {
    // Verify age before subscription
    const age = await this.getUserAge(userId);
    if (age < this.MINOR_AGE_LIMIT) {
      throw new Error('Parental consent required for subscription');
    }

    const subscription: Subscription = {
      id: this.generateTransactionId(),
      productId,
      userId,
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: this.calculateEndDate(30), // Monthly subscription
      nextBillingDate: this.calculateEndDate(30),
      amount,
      currency: 'USD',
      autoRenew: true,
      platform: Platform.OS as 'ios' | 'android',
    };

    await this.saveSubscription(subscription);
    await this.sendSubscriptionConfirmation(subscription);

    return subscription;
  }

  async cancelSubscription(subscriptionId: string, reason?: string): Promise<boolean> {
    const subscription = await this.getSubscription(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // ONE-CLICK CANCELLATION - No questions asked
    subscription.status = 'pending_cancellation';
    subscription.cancellationDate = new Date().toISOString();
    subscription.cancellationReason = reason || 'User requested';
    subscription.autoRenew = false;

    await this.saveSubscription(subscription);

    // Send immediate confirmation
    Alert.alert(
      'Subscription Cancelled',
      `Your subscription has been cancelled immediately. You will continue to have access until ${new Date(subscription.endDate).toLocaleDateString()}.`,
      [
        { text: 'OK' },
        {
          text: 'Undo',
          onPress: () => this.reactivateSubscription(subscriptionId),
        },
      ]
    );

    // Log for compliance
    await this.logCancellation(subscription);

    return true;
  }

  async reactivateSubscription(subscriptionId: string): Promise<boolean> {
    const subscription = await this.getSubscription(subscriptionId);
    if (!subscription) return false;

    subscription.status = 'active';
    subscription.autoRenew = true;
    subscription.cancellationDate = undefined;
    subscription.cancellationReason = undefined;

    await this.saveSubscription(subscription);
    return true;
  }

  // Direct link to subscription management (required by Apple/Google)
  openSubscriptionManagement() {
    const url = Platform.select({
      ios: 'https://apps.apple.com/account/subscriptions',
      android: 'https://play.google.com/store/account/subscriptions',
    });

    if (url) {
      Linking.openURL(url);
    }
  }

  // =============== REFUND SYSTEM ===============

  async requestRefund(transactionId: string, reason: string): Promise<RefundRequest> {
    const transaction = await this.getTransaction(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Check if within cooling-off period (14 days in EU)
    const purchaseDate = new Date(transaction.timestamp).getTime();
    const now = Date.now();
    const isWithinCoolingOff = now - purchaseDate <= this.COOLING_OFF_PERIOD;

    const refundRequest: RefundRequest = {
      transactionId,
      reason,
      requestDate: new Date().toISOString(),
      status: isWithinCoolingOff ? 'approved' : 'pending',
    };

    if (isWithinCoolingOff) {
      // Automatic refund within cooling-off period (EU law)
      await this.processRefund(transaction, refundRequest);
    } else {
      // Manual review required
      await this.submitForReview(refundRequest);
    }

    await this.saveRefundRequest(refundRequest);
    return refundRequest;
  }

  private async processRefund(transaction: Transaction, refundRequest: RefundRequest) {
    transaction.status = 'refunded';
    transaction.refundDate = new Date().toISOString();
    transaction.refundReason = refundRequest.reason;

    refundRequest.status = 'approved';
    refundRequest.processedDate = new Date().toISOString();
    refundRequest.refundAmount = transaction.amount;

    // Remove purchased items from user account
    await this.reversePurchase(transaction);

    // Process actual refund through payment provider
    await this.initiateProviderRefund(transaction);

    // Send confirmation
    Alert.alert(
      'Refund Processed',
      `Your refund of $${transaction.amount} has been processed. It may take 3-5 business days to appear in your account.`
    );
  }

  // =============== AGE VERIFICATION & PARENTAL CONTROLS ===============

  async verifyAge(birthDate: string): Promise<number> {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    await AsyncStorage.setItem('user_age', age.toString());
    await AsyncStorage.setItem('age_verified_date', new Date().toISOString());

    return age;
  }

  async checkParentalConsent(userId: string): Promise<boolean> {
    const age = await this.getUserAge(userId);

    if (age < this.MINOR_AGE_LIMIT) {
      // Require parental consent
      return await this.requestParentalConsent(userId);
    }

    return true;
  }

  private async requestParentalConsent(userId: string): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Parental Consent Required',
        'This purchase requires parental consent. A parent or guardian must approve this transaction.',
        [
          {
            text: 'Request Consent',
            onPress: () => {
              // In production, send email to parent
              this.sendParentalConsentEmail(userId);
              resolve(false);
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false),
          },
        ]
      );
    });
  }

  // =============== SPENDING LIMITS & PROTECTION ===============

  async checkSpendingLimit(userId: string, amount: number): Promise<boolean> {
    const age = await this.getUserAge(userId);
    const isMinor = age < 18;

    const spending = await this.getUserSpending(userId);
    const limits = isMinor
      ? {
          daily: this.SPENDING_LIMITS.minor_daily,
          weekly: this.SPENDING_LIMITS.minor_weekly,
          monthly: this.SPENDING_LIMITS.minor_monthly,
        }
      : {
          daily: this.SPENDING_LIMITS.daily,
          weekly: this.SPENDING_LIMITS.weekly,
          monthly: this.SPENDING_LIMITS.monthly,
        };

    if (spending.daily + amount > limits.daily) {
      Alert.alert(
        'Daily Spending Limit Reached',
        `You have reached your daily spending limit of $${limits.daily}. This limit resets tomorrow.`
      );
      return false;
    }

    if (spending.weekly + amount > limits.weekly) {
      Alert.alert(
        'Weekly Spending Limit Reached',
        `You have reached your weekly spending limit of $${limits.weekly}.`
      );
      return false;
    }

    if (spending.monthly + amount > limits.monthly) {
      Alert.alert(
        'Monthly Spending Limit Reached',
        `You have reached your monthly spending limit of $${limits.monthly}.`
      );
      return false;
    }

    return true;
  }

  // =============== PURCHASE VERIFICATION & VALIDATION ===============

  async validatePurchase(
    productId: string,
    userId: string,
    amount: number,
    receipt: string
  ): Promise<Transaction> {
    // Age verification
    const age = await this.getUserAge(userId);
    if (age < this.MINOR_AGE_LIMIT) {
      const hasConsent = await this.checkParentalConsent(userId);
      if (!hasConsent) {
        throw new Error('Parental consent required');
      }
    }

    // Spending limits
    const withinLimit = await this.checkSpendingLimit(userId, amount);
    if (!withinLimit) {
      throw new Error('Spending limit exceeded');
    }

    // Duplicate prevention
    const isDuplicate = await this.checkDuplicatePurchase(receipt);
    if (isDuplicate) {
      throw new Error('Duplicate purchase detected');
    }

    // Create transaction record
    const transaction: Transaction = {
      id: this.generateTransactionId(),
      userId,
      productId,
      amount,
      currency: 'USD',
      timestamp: new Date().toISOString(),
      status: 'pending',
      receiptData: receipt,
      parentalConsent: age < this.MINOR_AGE_LIMIT,
      ageVerified: true,
    };

    // Validate with payment provider
    const isValid = await this.validateWithProvider(receipt);
    if (!isValid) {
      transaction.status = 'failed';
      throw new Error('Invalid receipt');
    }

    transaction.status = 'completed';
    await this.saveTransaction(transaction);

    // Create audit trail
    await this.createAuditLog(transaction);

    return transaction;
  }

  // =============== PURCHASE RESTORATION ===============

  async restorePurchases(userId: string): Promise<Transaction[]> {
    try {
      // Get all purchases for user
      const transactions = await this.getUserTransactions(userId);
      const validPurchases = transactions.filter((t) => t.status === 'completed');

      // Restore each purchase
      for (const purchase of validPurchases) {
        await this.restorePurchaseItems(purchase);
      }

      Alert.alert(
        'Purchases Restored',
        `Successfully restored ${validPurchases.length} purchase(s).`
      );

      return validPurchases;
    } catch (error) {
      Alert.alert('Restoration Failed', 'Unable to restore purchases. Please try again later.');
      throw error;
    }
  }

  // =============== AUDIT & COMPLIANCE LOGGING ===============

  private async createAuditLog(transaction: Transaction) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      transactionId: transaction.id,
      userId: transaction.userId,
      action: 'purchase',
      amount: transaction.amount,
      currency: transaction.currency,
      ipAddress: await this.getUserIP(),
      deviceId: await this.getDeviceId(),
      platform: Platform.OS,
      appVersion: await this.getAppVersion(),
    };

    // Store for 7 years (financial regulation requirement)
    await this.storeAuditLog(auditEntry);
  }

  // =============== COMPLIANCE HELPERS ===============

  private async getUserAge(userId: string): Promise<number> {
    const storedAge = await AsyncStorage.getItem('user_age');
    return storedAge ? parseInt(storedAge) : 0;
  }

  private async getUserSpending(userId: string) {
    const transactions = await this.getUserTransactions(userId);
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const daily = transactions
      .filter((t) => new Date(t.timestamp).getTime() > dayAgo && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const weekly = transactions
      .filter((t) => new Date(t.timestamp).getTime() > weekAgo && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthly = transactions
      .filter((t) => new Date(t.timestamp).getTime() > monthAgo && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    return { daily, weekly, monthly };
  }

  private async checkDuplicatePurchase(receipt: string): Promise<boolean> {
    const existing = await AsyncStorage.getItem(`receipt_${receipt}`);
    return existing !== null;
  }

  private async validateWithProvider(receipt: string): Promise<boolean> {
    // In production, validate with Apple/Google
    // This is a mock implementation
    return true;
  }

  private calculateEndDate(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }

  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // =============== DATA PERSISTENCE ===============

  private async saveSubscription(subscription: Subscription) {
    const key = `subscription_${subscription.id}`;
    await AsyncStorage.setItem(key, JSON.stringify(subscription));
  }

  private async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    const key = `subscription_${subscriptionId}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  private async saveTransaction(transaction: Transaction) {
    const key = `transaction_${transaction.id}`;
    await AsyncStorage.setItem(key, JSON.stringify(transaction));

    // Also store receipt to prevent duplicates
    if (transaction.receiptData) {
      await AsyncStorage.setItem(`receipt_${transaction.receiptData}`, transaction.id);
    }
  }

  private async getTransaction(transactionId: string): Promise<Transaction | null> {
    const key = `transaction_${transactionId}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  private async getUserTransactions(userId: string): Promise<Transaction[]> {
    // In production, query from database
    // This is a mock implementation
    return [];
  }

  private async saveRefundRequest(refundRequest: RefundRequest) {
    const key = `refund_${refundRequest.transactionId}`;
    await AsyncStorage.setItem(key, JSON.stringify(refundRequest));
  }

  // =============== NOTIFICATION HELPERS ===============

  private async sendSubscriptionConfirmation(subscription: Subscription) {
    // Send email confirmation
    console.log('Sending subscription confirmation:', subscription);
  }

  private async sendParentalConsentEmail(userId: string) {
    // Send email to parent
    console.log('Sending parental consent request for:', userId);
  }

  private async logCancellation(subscription: Subscription) {
    // Log for compliance
    console.log('Subscription cancelled:', subscription);
  }

  private async submitForReview(refundRequest: RefundRequest) {
    // Submit to support team
    console.log('Refund request submitted for review:', refundRequest);
  }

  private async reversePurchase(transaction: Transaction) {
    // Remove purchased items
    console.log('Reversing purchase:', transaction);
  }

  private async initiateProviderRefund(transaction: Transaction) {
    // Process with payment provider
    console.log('Initiating provider refund:', transaction);
  }

  private async restorePurchaseItems(transaction: Transaction) {
    // Restore purchased items
    console.log('Restoring purchase:', transaction);
  }

  private async storeAuditLog(auditEntry: any) {
    // Store for compliance
    console.log('Audit log:', auditEntry);
  }

  private async getUserIP(): Promise<string> {
    // Get user IP for audit
    return '0.0.0.0';
  }

  private async getDeviceId(): Promise<string> {
    // Get device ID for audit
    return 'device_id';
  }

  private async getAppVersion(): Promise<string> {
    // Get app version for audit
    return '1.0.0';
  }
}

export const paymentCompliance = PaymentComplianceSystem.getInstance();
