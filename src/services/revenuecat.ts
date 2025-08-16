import Purchases, { 
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  PurchasesStoreProduct,
  LOG_LEVEL
} from 'react-native-purchases';
import { Platform } from 'react-native';

class RevenueCatService {
  private initialized = false;
  private apiKey: string = '';

  async initialize() {
    if (this.initialized) return;

    try {
      // Get API key based on platform
      this.apiKey = Platform.select({
        ios: process.env.REVENUECAT_API_KEY_IOS || '',
        android: process.env.REVENUECAT_API_KEY_ANDROID || '',
        default: ''
      });

      if (!this.apiKey) {
        console.warn('RevenueCat API key not configured');
        return false;
      }

      // Configure RevenueCat
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      await Purchases.configure({ apiKey: this.apiKey });
      this.initialized = true;
      
      console.log('RevenueCat initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      return false;
    }
  }

  async getOfferings(): Promise<PurchasesOffering | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      console.error('Error fetching offerings:', error);
      return null;
    }
  }

  async purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return customerInfo;
    } catch (error: any) {
      if (!error.userCancelled) {
        console.error('Purchase error:', error);
      }
      return null;
    }
  }

  async purchaseProduct(product: PurchasesStoreProduct): Promise<CustomerInfo | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const { customerInfo } = await Purchases.purchaseStoreProduct(product);
      return customerInfo;
    } catch (error: any) {
      if (!error.userCancelled) {
        console.error('Purchase error:', error);
      }
      return null;
    }
  }

  async restorePurchases(): Promise<CustomerInfo | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo;
    } catch (error) {
      console.error('Restore error:', error);
      return null;
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.error('Error getting customer info:', error);
      return null;
    }
  }

  async checkSubscriptionStatus(): Promise<boolean> {
    const customerInfo = await this.getCustomerInfo();
    if (!customerInfo) return false;

    // Check for active subscriptions
    return Object.keys(customerInfo.activeSubscriptions).length > 0;
  }

  async hasActiveEntitlement(entitlementId: string): Promise<boolean> {
    const customerInfo = await this.getCustomerInfo();
    if (!customerInfo) return false;

    return customerInfo.entitlements.active[entitlementId] !== undefined;
  }

  async logout() {
    if (!this.initialized) return;

    try {
      await Purchases.logOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async login(userId: string) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const { customerInfo } = await Purchases.logIn(userId);
      return customerInfo;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  }
}

export default new RevenueCatService();