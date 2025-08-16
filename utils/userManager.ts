// Utility to sanitize SQL-like input
function sanitizeInput(input: string): string {
  // Remove quotes, semicolons, and dangerous SQL keywords
  let sanitized = input.replace(/['";]/g, '');
  sanitized = sanitized.replace(/\b(DROP|TABLE|DELETE|INSERT|UPDATE|ALTER|CREATE|REPLACE|TRUNCATE|EXEC|UNION)\b/gi, '');
  return sanitized;
}
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../firebase/config';
import { offlineManager } from './offlineManager';
import SHA256 from 'crypto-js/sha256';
// Utility to hash passwords
function hashPassword(password: string): string {
  return SHA256(password).toString();
}

export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  email?: string | undefined;
  photoURL?: string;
  coins: number;
  highScore: number;
  gamesPlayed: number;
  achievements: string[];
  level: number;
  createdAt: Date;
  lastSeen: Date;
  isOnline: boolean;
  friends: string[];
  privacySettings: {
    showOnlineStatus: boolean;
    allowFriendRequests: boolean;
    showInLeaderboards: boolean;
  };
}

export interface UsernameValidation {
  isValid: boolean;
  error?: string;
}

export class UserManager {
  private static instance: UserManager;
  private currentUser: UserProfile | null = null;

  static getInstance(): UserManager {
    if (!UserManager.instance) {
      UserManager.instance = new UserManager();
    }
    return UserManager.instance;
  }

  // Create new user profile
  async createUserProfile(uid: string, username: string, displayName: string, email?: string, password?: string): Promise<UserProfile> {
    // Hash password if provided
    const hashedPassword = password ? hashPassword(password) : undefined;
    const userProfile: UserProfile = {
      uid,
      username: username.toLowerCase(),
      displayName,
      email,
      // Store hashed password if present
      ...(hashedPassword ? { password: hashedPassword } : {}),
      coins: 100, // Starting coins
      highScore: 0,
      gamesPlayed: 0,
      achievements: [],
      level: 1,
      createdAt: new Date(),
      lastSeen: new Date(),
      isOnline: true,
      friends: [],
      privacySettings: {
        showOnlineStatus: true,
        allowFriendRequests: true,
        showInLeaderboards: true,
      },
    };

    try {
      // Save to Firebase
  await setDoc(doc(firestore, 'users', uid), userProfile);
      // Save to offline storage as backup
      await offlineManager.saveOfflineData(uid, {
        coins: userProfile.coins,
        highScore: userProfile.highScore,
        gamesPlayed: userProfile.gamesPlayed,
        achievements: userProfile.achievements,
      });
      this.currentUser = userProfile;
      return userProfile;
    } catch (error) {
      console.log('Error creating user profile:', error);
      throw error;
    }
  }

  // Get user profile
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
  const userDoc = await getDoc(doc(firestore, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
    } catch (error) {
      console.log('Error getting user profile:', error);
    }
    return null;
  }

  // Update user profile
  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
  await updateDoc(doc(firestore, 'users', uid), {
        ...updates,
        lastSeen: new Date(),
      });

      // Update current user if it's the same user
      if (this.currentUser?.uid === uid) {
        this.currentUser = { ...this.currentUser, ...updates };
      }
    } catch (error) {
      console.log('Error updating user profile:', error);
    }
  }

  // Validate username
  async validateUsername(username: string): Promise<UsernameValidation> {
    const cleanUsername = username.toLowerCase().trim();
    
    // Check username format
    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      return {
        isValid: false,
        error: 'Username must be between 3 and 20 characters'
      };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return {
        isValid: false,
        error: 'Username can only contain letters, numbers, and underscores'
      };
    }

    // Check if username is already taken
    try {
  const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('username', '==', cleanUsername));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        return {
          isValid: false,
          error: 'Username is already taken'
        };
      }
    } catch (error) {
      console.log('Error checking username availability:', error);
      return {
        isValid: false,
        error: 'Unable to check username availability'
      };
    }

    return { isValid: true };
  }

  // Search users by username
  async searchUsers(searchQuery: string, limit: number = 10): Promise<UserProfile[]> {
    try {
  const usersRef = collection(firestore, 'users');
      const q = query(
        usersRef,
        where('username', '>=', searchQuery.toLowerCase()),
        where('username', '<=', searchQuery.toLowerCase() + '\uf8ff')
      );
      const snapshot = await getDocs(q);
      
      const users: UserProfile[] = [];
      snapshot.forEach(doc => {
        const user = doc.data() as UserProfile;
        if (user.privacySettings.showInLeaderboards) {
          users.push(user);
        }
      });
      
      return users.slice(0, limit);
    } catch (error) {
      console.log('Error searching users:', error);
      return [];
    }
  }

  // Get user by username
  async getUserByUsername(username: string): Promise<UserProfile | null> {
    try {
  const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('username', '==', username.toLowerCase()));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        return snapshot.docs[0].data() as UserProfile;
      }
    } catch (error) {
      console.log('Error getting user by username:', error);
    }
    return null;
  }

  // Add friend
  async addFriend(userId: string, friendId: string): Promise<void> {
    try {
      // Add friend to user's friends list
  await updateDoc(doc(firestore, 'users', userId), {
        friends: [...(this.currentUser?.friends || []), friendId]
      });

      // Add user to friend's friends list
  await updateDoc(doc(firestore, 'users', friendId), {
        friends: [...(await this.getUserProfile(friendId))?.friends || [], userId]
      });
    } catch (error) {
      console.log('Error adding friend:', error);
    }
  }

  // Remove friend
  async removeFriend(userId: string, friendId: string): Promise<void> {
    try {
      // Remove friend from user's friends list
      const userProfile = await this.getUserProfile(userId);
      if (userProfile) {
  await updateDoc(doc(firestore, 'users', userId), {
          friends: userProfile.friends.filter(id => id !== friendId)
        });
      }

      // Remove user from friend's friends list
      const friendProfile = await this.getUserProfile(friendId);
      if (friendProfile) {
  await updateDoc(doc(firestore, 'users', friendId), {
          friends: friendProfile.friends.filter(id => id !== userId)
        });
      }
    } catch (error) {
      console.log('Error removing friend:', error);
    }
  }

  // Get user's friends
  async getUserFriends(userId: string): Promise<UserProfile[]> {
    try {
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) return [];

      const friends: UserProfile[] = [];
      for (const friendId of userProfile.friends) {
        const friendProfile = await this.getUserProfile(friendId);
        if (friendProfile) {
          friends.push(friendProfile);
        }
      }
      return friends;
    } catch (error) {
      console.log('Error getting user friends:', error);
      return [];
    }
  }

  // Update online status
  async updateOnlineStatus(uid: string, isOnline: boolean): Promise<void> {
    try {
  await updateDoc(doc(firestore, 'users', uid), {
        isOnline,
        lastSeen: new Date(),
      });
    } catch (error) {
      console.log('Error updating online status:', error);
    }
  }

  // Get current user
  getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  // Set current user
  setCurrentUser(user: UserProfile): void {
    this.currentUser = user;
  }

  // Update user stats
  async updateUserStats(uid: string, stats: {
    coins?: number;
    highScore?: number;
    gamesPlayed?: number;
    achievements?: string[];
    level?: number;
  }): Promise<void> {
    try {
  await updateDoc(doc(firestore, 'users', uid), stats);
      
      // Update offline data
      await offlineManager.saveOfflineData(uid, stats);
      
      // Update current user if it's the same user
      if (this.currentUser?.uid === uid) {
        this.currentUser = { ...this.currentUser, ...stats };
      }
    } catch (error) {
      console.log('Error updating user stats:', error);
    }
  }

  // Get leaderboard users
  async getLeaderboardUsers(limit: number = 50): Promise<UserProfile[]> {
    try {
  const usersRef = collection(firestore, 'users');
      const q = query(
        usersRef,
        where('privacySettings.showInLeaderboards', '==', true)
      );
      const snapshot = await getDocs(q);
      
      const users: UserProfile[] = [];
      snapshot.forEach(doc => {
        users.push(doc.data() as UserProfile);
      });
      
      // Sort by high score descending
      return users
        .sort((a, b) => b.highScore - a.highScore)
        .slice(0, limit);
    } catch (error) {
      console.log('Error getting leaderboard users:', error);
      return [];
    }
  }

  // Delete user account
  async deleteUserAccount(uid: string): Promise<void> {
    try {
      // Delete user document
  await setDoc(doc(firestore, 'users', uid), { deleted: true });
      
      // Clear offline data
      await offlineManager.clearAllOfflineData();
      
      // Clear current user
      if (this.currentUser?.uid === uid) {
        this.currentUser = null;
      }
    } catch (error) {
      console.log('Error deleting user account:', error);
    }
  }
}

export const userManager = UserManager.getInstance(); 