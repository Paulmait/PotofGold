import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
  onAuthStateChanged,
  sendEmailVerification,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  createdAt: any;
  lastLogin: any;
  gameProgress: {
    level: number;
    coins: number;
    highScore: number;
    totalPlayTime: number;
    achievements: string[];
    unlockedSkins: string[];
    selectedSkin: string;
    potLevel: number;
    potSpeed: number;
    potSize: number;
  };
  settings: {
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    notificationsEnabled: boolean;
    language: string;
  };
  subscription: {
    isActive: boolean;
    type: 'free' | 'premium' | 'vip';
    expiresAt: any;
  };
}

class AuthService {
  private currentUser: User | null = null;
  private userProfile: UserProfile | null = null;

  constructor() {
    this.initializeAuthListener();
  }

  private initializeAuthListener() {
    onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      if (user) {
        await this.loadUserProfile(user.uid);
        await this.updateLastLogin(user.uid);
        Sentry.setUser({ id: user.uid, email: user.email || undefined });
      } else {
        this.userProfile = null;
        Sentry.setUser(null);
      }
    });
  }

  async signUp(email: string, password: string, displayName: string): Promise<UserProfile> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update display name
      await updateProfile(user, { displayName });

      // Send email verification
      await sendEmailVerification(user);

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName,
        isAdmin: false,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        gameProgress: {
          level: 1,
          coins: 100, // Starting coins
          highScore: 0,
          totalPlayTime: 0,
          achievements: [],
          unlockedSkins: ['default'],
          selectedSkin: 'default',
          potLevel: 1,
          potSpeed: 1,
          potSize: 1,
        },
        settings: {
          soundEnabled: true,
          vibrationEnabled: true,
          notificationsEnabled: true,
          language: 'en',
        },
        subscription: {
          isActive: false,
          type: 'free',
          expiresAt: null,
        },
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);

      // Track signup event
      Sentry.captureMessage('New user signup', 'info');

      this.userProfile = userProfile;
      return userProfile;
    } catch (error: any) {
      Sentry.captureException(error);
      throw this.handleAuthError(error);
    }
  }

  async signIn(email: string, password: string): Promise<UserProfile> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Load user profile
      const profile = await this.loadUserProfile(user.uid);
      if (!profile) {
        throw new Error('User profile not found');
      }

      // Update last login
      await this.updateLastLogin(user.uid);

      // Cache credentials for offline access
      await AsyncStorage.setItem('lastUserEmail', email);

      return profile;
    } catch (error: any) {
      Sentry.captureException(error);
      throw this.handleAuthError(error);
    }
  }

  async signOutUser(): Promise<void> {
    try {
      await signOut(auth);
      await AsyncStorage.multiRemove(['lastUserEmail', 'userProfile']);
      this.currentUser = null;
      this.userProfile = null;
    } catch (error: any) {
      Sentry.captureException(error);
      throw error;
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
      Sentry.captureMessage(`Password reset sent to ${email}`, 'info');
    } catch (error: any) {
      Sentry.captureException(error);
      throw this.handleAuthError(error);
    }
  }

  async loadUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const profile = docSnap.data() as UserProfile;
        this.userProfile = profile;

        // Cache profile locally
        await AsyncStorage.setItem('userProfile', JSON.stringify(profile));

        // Also trigger unlocks preloading
        await this.preloadUserUnlocks(uid);

        return profile;
      }

      // Try loading from cache if online fetch fails
      const cached = await AsyncStorage.getItem('userProfile');
      if (cached) {
        return JSON.parse(cached);
      }

      return null;
    } catch (error: any) {
      Sentry.captureException(error);

      // Fallback to cached profile
      const cached = await AsyncStorage.getItem('userProfile');
      if (cached) {
        return JSON.parse(cached);
      }

      throw error;
    }
  }

  async preloadUserUnlocks(uid: string): Promise<void> {
    try {
      // Preload unlocks data for faster access
      const unlocksRef = doc(db, 'users', uid, 'unlocks', 'data');
      const unlocksSnap = await getDoc(unlocksRef);

      if (unlocksSnap.exists()) {
        // Cache unlocks data
        await AsyncStorage.setItem(`unlocks_${uid}`, JSON.stringify(unlocksSnap.data()));
        console.log('User unlocks preloaded successfully');
      } else {
        console.log('No unlocks data found, will be initialized on first access');
      }
    } catch (error) {
      console.error('Error preloading unlocks:', error);
      // Non-critical error, don't throw
    }
  }

  async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }

    try {
      const docRef = doc(db, 'users', this.currentUser.uid);
      await updateDoc(docRef, updates);

      // Update local cache
      if (this.userProfile) {
        this.userProfile = { ...this.userProfile, ...updates };
        await AsyncStorage.setItem('userProfile', JSON.stringify(this.userProfile));
      }
    } catch (error: any) {
      Sentry.captureException(error);
      throw error;
    }
  }

  async saveGameProgress(progress: Partial<UserProfile['gameProgress']>): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }

    try {
      const updates = {
        gameProgress: {
          ...this.userProfile?.gameProgress,
          ...progress,
        },
      };

      await this.updateUserProfile(updates);
    } catch (error: any) {
      // Queue for offline sync
      await this.queueOfflineUpdate('gameProgress', progress);
      Sentry.captureException(error);
    }
  }

  private async updateLastLogin(uid: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        lastLogin: serverTimestamp(),
      });
    } catch (error) {
      // Non-critical error, just log it
      console.log('Failed to update last login:', error);
    }
  }

  private async queueOfflineUpdate(type: string, data: any): Promise<void> {
    const queue = (await AsyncStorage.getItem('offlineQueue')) || '[]';
    const updates = JSON.parse(queue);
    updates.push({
      type,
      data,
      timestamp: Date.now(),
    });
    await AsyncStorage.setItem('offlineQueue', JSON.stringify(updates));
  }

  async syncOfflineUpdates(): Promise<void> {
    if (!this.currentUser) return;

    try {
      const queue = await AsyncStorage.getItem('offlineQueue');
      if (!queue) return;

      const updates = JSON.parse(queue);
      for (const update of updates) {
        if (update.type === 'gameProgress') {
          await this.saveGameProgress(update.data);
        }
      }

      // Clear queue after successful sync
      await AsyncStorage.removeItem('offlineQueue');
    } catch (error: any) {
      Sentry.captureException(error);
    }
  }

  // Admin functions
  async checkAdminStatus(): Promise<boolean> {
    if (!this.currentUser) return false;

    try {
      const adminDoc = await getDoc(doc(db, 'admins', this.currentUser.uid));
      return adminDoc.exists();
    } catch (error) {
      return false;
    }
  }

  async getAllUsers(limitCount: number = 50): Promise<UserProfile[]> {
    if (!(await this.checkAdminStatus())) {
      throw new Error('Unauthorized: Admin access required');
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'), limit(limitCount));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => doc.data() as UserProfile);
    } catch (error: any) {
      Sentry.captureException(error);
      throw error;
    }
  }

  async resetUserAccount(userId: string): Promise<void> {
    if (!(await this.checkAdminStatus())) {
      throw new Error('Unauthorized: Admin access required');
    }

    try {
      const resetData = {
        gameProgress: {
          level: 1,
          coins: 100,
          highScore: 0,
          totalPlayTime: 0,
          achievements: [],
          unlockedSkins: ['default'],
          selectedSkin: 'default',
          potLevel: 1,
          potSpeed: 1,
          potSize: 1,
        },
      };

      await updateDoc(doc(db, 'users', userId), resetData);

      Sentry.captureMessage(`Admin reset account for user ${userId}`, 'info');
    } catch (error: any) {
      Sentry.captureException(error);
      throw error;
    }
  }

  private handleAuthError(error: any): Error {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return new Error('This email is already registered');
      case 'auth/invalid-email':
        return new Error('Invalid email address');
      case 'auth/weak-password':
        return new Error('Password should be at least 6 characters');
      case 'auth/user-not-found':
        return new Error('No account found with this email');
      case 'auth/wrong-password':
        return new Error('Incorrect password');
      case 'auth/network-request-failed':
        return new Error('Network error. Please check your connection');
      case 'auth/too-many-requests':
        return new Error('Too many attempts. Please try again later');
      default:
        return new Error(error.message || 'Authentication failed');
    }
  }

  // Getters
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getUserProfile(): UserProfile | null {
    return this.userProfile;
  }

  isLoggedIn(): boolean {
    return this.currentUser !== null;
  }
}

export default new AuthService();
