import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = 'pot_of_gold_session';
const USER_DATA_KEY = 'pot_of_gold_user_data';
const ONBOARDING_KEY = 'pot_of_gold_onboarding_complete';
const LEGAL_ACCEPTED_KEY = 'pot_of_gold_legal_accepted';
const LOCATION_KEY = 'pot_of_gold_user_location';

interface SessionData {
  userId: string;
  email?: string;
  displayName?: string;
  isGuest: boolean;
  lastActive: number;
  hasCompletedOnboarding: boolean;
  hasAcceptedLegal: boolean;
  legalVersion: string;
}

interface UserLocation {
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  country?: string;
  timestamp: number;
}

class SessionPersistenceService {
  // Session timeout in milliseconds (24 hours)
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000;

  // Save session data
  async saveSession(data: Partial<SessionData>): Promise<void> {
    try {
      const existingSession = await this.getSession();
      const updatedSession: SessionData = {
        ...existingSession,
        ...data,
        lastActive: Date.now(),
      };

      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));

      // Also save individual flags for quick access
      if (data.hasCompletedOnboarding !== undefined) {
        await AsyncStorage.setItem(ONBOARDING_KEY, data.hasCompletedOnboarding ? 'true' : 'false');
      }
      if (data.hasAcceptedLegal !== undefined) {
        await AsyncStorage.setItem(
          LEGAL_ACCEPTED_KEY,
          JSON.stringify({
            accepted: data.hasAcceptedLegal,
            version: data.legalVersion || '2.0',
            timestamp: Date.now(),
          })
        );
      }
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  // Get session data
  async getSession(): Promise<SessionData | null> {
    try {
      const sessionStr = await AsyncStorage.getItem(SESSION_KEY);
      if (!sessionStr) return null;

      const session: SessionData = JSON.parse(sessionStr);

      // Check if session is expired
      if (Date.now() - session.lastActive > this.SESSION_TIMEOUT) {
        // Session expired but keep user preferences
        return {
          ...session,
          lastActive: Date.now(),
        };
      }

      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  // Save user location
  async saveLocation(location: UserLocation): Promise<void> {
    try {
      await AsyncStorage.setItem(
        LOCATION_KEY,
        JSON.stringify({
          ...location,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error('Error saving location:', error);
    }
  }

  // Get user location
  async getLocation(): Promise<UserLocation | null> {
    try {
      const locationStr = await AsyncStorage.getItem(LOCATION_KEY);
      if (!locationStr) return null;

      return JSON.parse(locationStr);
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  }

  // Check if user has completed onboarding
  async hasCompletedOnboarding(): Promise<boolean> {
    try {
      // First check the quick flag
      const onboardingComplete = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (onboardingComplete === 'true') return true;

      // Also check session data
      const session = await this.getSession();
      return session?.hasCompletedOnboarding || false;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  }

  // Check if user has accepted legal agreements
  async hasAcceptedLegal(currentVersion: string = '2.0'): Promise<boolean> {
    try {
      const legalStr = await AsyncStorage.getItem(LEGAL_ACCEPTED_KEY);
      if (!legalStr) return false;

      const legal = JSON.parse(legalStr);
      return legal.accepted && legal.version === currentVersion;
    } catch (error) {
      console.error('Error checking legal status:', error);
      return false;
    }
  }

  // Mark onboarding as complete
  async completeOnboarding(): Promise<void> {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      const session = await this.getSession();
      if (session) {
        await this.saveSession({
          ...session,
          hasCompletedOnboarding: true,
        });
      }
    } catch (error) {
      console.error('Error marking onboarding complete:', error);
    }
  }

  // Accept legal agreements
  async acceptLegal(version: string = '2.0'): Promise<void> {
    try {
      await AsyncStorage.setItem(
        LEGAL_ACCEPTED_KEY,
        JSON.stringify({
          accepted: true,
          version,
          timestamp: Date.now(),
        })
      );

      const session = await this.getSession();
      if (session) {
        await this.saveSession({
          ...session,
          hasAcceptedLegal: true,
          legalVersion: version,
        });
      }
    } catch (error) {
      console.error('Error accepting legal:', error);
    }
  }

  // Clear session (for logout)
  async clearSession(): Promise<void> {
    try {
      // Keep onboarding and legal status
      const onboardingComplete = await this.hasCompletedOnboarding();
      const legalAccepted = await this.hasAcceptedLegal();
      const location = await this.getLocation();

      await AsyncStorage.removeItem(SESSION_KEY);

      // Restore preferences that should persist
      if (onboardingComplete) {
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      }
      if (legalAccepted) {
        // Keep legal acceptance
      }
      if (location) {
        await this.saveLocation(location);
      }
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  // Update last active time
  async updateLastActive(): Promise<void> {
    try {
      const session = await this.getSession();
      if (session) {
        await this.saveSession({
          ...session,
          lastActive: Date.now(),
        });
      }
    } catch (error) {
      console.error('Error updating last active:', error);
    }
  }

  // Auto-save user data when authenticated
  async saveUserData(
    userId: string,
    email?: string,
    displayName?: string,
    isGuest: boolean = false
  ): Promise<void> {
    try {
      await this.saveSession({
        userId,
        email,
        displayName,
        isGuest,
        lastActive: Date.now(),
      });

      // Also save to a separate key for persistence
      await AsyncStorage.setItem(
        USER_DATA_KEY,
        JSON.stringify({
          userId,
          email,
          displayName,
          isGuest,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  // Get saved user data
  async getSavedUserData(): Promise<any> {
    try {
      const userDataStr = await AsyncStorage.getItem(USER_DATA_KEY);
      if (!userDataStr) return null;

      return JSON.parse(userDataStr);
    } catch (error) {
      console.error('Error getting saved user data:', error);
      return null;
    }
  }
}

export default new SessionPersistenceService();
