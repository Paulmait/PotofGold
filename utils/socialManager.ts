import { Share, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import { captureRef } from 'react-native-view-shot';

interface LeaderboardEntry {
  id: string;
  username: string;
  score: number;
  level: number;
  coins: number;
  rank: number;
  avatar?: string;
  country?: string;
  timestamp: Date;
  isCurrentUser?: boolean;
}

interface Friend {
  id: string;
  username: string;
  avatar?: string;
  level: number;
  lastPlayed: Date;
  highScore: number;
  status: 'online' | 'offline' | 'playing';
}

interface Challenge {
  id: string;
  challengerId: string;
  challengerName: string;
  challengedId: string;
  challengedName: string;
  type: 'score' | 'coins' | 'survival' | 'combo';
  target: number;
  reward: number;
  status: 'pending' | 'active' | 'completed' | 'expired';
  expiresAt: Date;
  createdAt: Date;
}

interface ShareContent {
  title: string;
  message: string;
  url?: string;
  imageUrl?: string;
}

class SocialManager {
  private leaderboard: Map<string, LeaderboardEntry[]> = new Map();
  private friends: Friend[] = [];
  private challenges: Challenge[] = [];
  private currentUserId: string = '';
  private shareCount: number = 0;
  private invitesSent: number = 0;
  private referralCode: string = '';

  constructor() {
    this.initializeSocial();
  }

  private async initializeSocial() {
    try {
      // Load saved social data
      const data = await AsyncStorage.multiGet([
        'social_friends',
        'social_challenges',
        'social_share_count',
        'social_invites_sent',
        'social_referral_code',
        'user_id',
      ]);

      data.forEach(([key, value]) => {
        if (value) {
          switch (key) {
            case 'social_friends':
              this.friends = JSON.parse(value);
              break;
            case 'social_challenges':
              this.challenges = JSON.parse(value);
              break;
            case 'social_share_count':
              this.shareCount = parseInt(value);
              break;
            case 'social_invites_sent':
              this.invitesSent = parseInt(value);
              break;
            case 'social_referral_code':
              this.referralCode = value;
              break;
            case 'user_id':
              this.currentUserId = value;
              break;
          }
        }
      });

      // Generate referral code if not exists
      if (!this.referralCode) {
        this.referralCode = this.generateReferralCode();
        await this.saveSocialData();
      }

      // Load initial leaderboard data
      await this.fetchLeaderboards();
    } catch (error) {
      console.error('Error initializing social:', error);
    }
  }

  private generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'POT';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private async saveSocialData() {
    try {
      await AsyncStorage.multiSet([
        ['social_friends', JSON.stringify(this.friends)],
        ['social_challenges', JSON.stringify(this.challenges)],
        ['social_share_count', this.shareCount.toString()],
        ['social_invites_sent', this.invitesSent.toString()],
        ['social_referral_code', this.referralCode],
      ]);
    } catch (error) {
      console.error('Error saving social data:', error);
    }
  }

  // Leaderboard methods
  public async fetchLeaderboards() {
    try {
      // Simulate fetching leaderboard data
      // In production, this would call your backend API

      // Global leaderboard
      const globalLeaderboard: LeaderboardEntry[] = this.generateMockLeaderboard('global', 100);
      this.leaderboard.set('global', globalLeaderboard);

      // Weekly leaderboard
      const weeklyLeaderboard: LeaderboardEntry[] = this.generateMockLeaderboard('weekly', 50);
      this.leaderboard.set('weekly', weeklyLeaderboard);

      // Daily leaderboard
      const dailyLeaderboard: LeaderboardEntry[] = this.generateMockLeaderboard('daily', 25);
      this.leaderboard.set('daily', dailyLeaderboard);

      // Friends leaderboard
      const friendsLeaderboard: LeaderboardEntry[] = this.generateFriendsLeaderboard();
      this.leaderboard.set('friends', friendsLeaderboard);

      return true;
    } catch (error) {
      console.error('Error fetching leaderboards:', error);
      return false;
    }
  }

  private generateMockLeaderboard(type: string, count: number): LeaderboardEntry[] {
    const names = [
      'GoldMaster',
      'CoinKing',
      'DiamondHunter',
      'TreasureSeeker',
      'MineExpert',
      'RichMiner',
      'GemCollector',
      'LuckyPlayer',
      'ProGamer',
      'ElitePlayer',
      'ChampionMiner',
      'GoldDigger',
      'CrystalHunter',
      'MegaCollector',
      'SuperMiner',
    ];

    const countries = ['US', 'UK', 'CA', 'AU', 'DE', 'FR', 'JP', 'KR', 'BR', 'MX'];

    const leaderboard: LeaderboardEntry[] = [];

    for (let i = 0; i < count; i++) {
      const score = Math.floor(Math.random() * 1000000) + (count - i) * 10000;
      leaderboard.push({
        id: `user_${i}`,
        username: `${names[i % names.length]}${Math.floor(Math.random() * 999)}`,
        score,
        level: Math.floor(score / 10000) + 1,
        coins: Math.floor(score / 100),
        rank: i + 1,
        country: countries[Math.floor(Math.random() * countries.length)],
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        isCurrentUser: i === 10, // Mock current user at rank 11
      });
    }

    return leaderboard;
  }

  private generateFriendsLeaderboard(): LeaderboardEntry[] {
    return this.friends
      .map((friend, index) => ({
        id: friend.id,
        username: friend.username,
        score: friend.highScore,
        level: friend.level,
        coins: Math.floor(friend.highScore / 100),
        rank: index + 1,
        avatar: friend.avatar,
        timestamp: friend.lastPlayed,
        isCurrentUser: false,
      }))
      .sort((a, b) => b.score - a.score);
  }

  public getLeaderboard(type: 'global' | 'weekly' | 'daily' | 'friends'): LeaderboardEntry[] {
    return this.leaderboard.get(type) || [];
  }

  public getUserRank(type: 'global' | 'weekly' | 'daily' | 'friends'): number {
    const board = this.leaderboard.get(type);
    if (!board) return 0;

    const userEntry = board.find((entry) => entry.isCurrentUser);
    return userEntry?.rank || 0;
  }

  // Social sharing
  public async shareScore(score: number, level: number) {
    const content: ShareContent = {
      title: 'Pot of Gold - New High Score!',
      message: `I just scored ${score.toLocaleString()} points and reached level ${level} in Pot of Gold! Can you beat my score? 🏆`,
      url: `https://potofgold.game/play?ref=${this.referralCode}`,
    };

    return this.share(content);
  }

  public async shareAchievement(achievement: string) {
    const content: ShareContent = {
      title: 'Pot of Gold - Achievement Unlocked!',
      message: `I just unlocked "${achievement}" in Pot of Gold! Join me in this amazing treasure hunting adventure! 🎯`,
      url: `https://potofgold.game/play?ref=${this.referralCode}`,
    };

    return this.share(content);
  }

  public async shareInvite() {
    const content: ShareContent = {
      title: 'Join me in Pot of Gold!',
      message: `Hey! I'm playing Pot of Gold and it's amazing! Use my code ${this.referralCode} to get 100 bonus coins when you start! 💰`,
      url: `https://potofgold.game/invite?code=${this.referralCode}`,
    };

    const result = await this.share(content);
    if (result.success) {
      this.invitesSent++;
      await this.saveSocialData();
    }

    return result;
  }

  public async shareScreenshot(viewRef: any) {
    try {
      // Capture screenshot
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 0.9,
      });

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Share your Pot of Gold moment!',
          });

          this.shareCount++;
          await this.saveSocialData();

          return { success: true };
        }
      }

      return { success: false, error: 'Sharing not available' };
    } catch (error) {
      console.error('Error sharing screenshot:', error);
      return { success: false, error: 'Failed to share screenshot' };
    }
  }

  private async share(content: ShareContent): Promise<{ success: boolean; error?: string }> {
    try {
      const shareOptions = {
        title: content.title,
        message: content.message,
        url: content.url,
      };

      const result = await Share.share(shareOptions);

      if (result.action === Share.sharedAction) {
        this.shareCount++;
        await this.saveSocialData();
        return { success: true };
      } else if (result.action === Share.dismissedAction) {
        return { success: false, error: 'Share cancelled' };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error sharing:', error);
      return { success: false, error: error.message };
    }
  }

  // Friend management
  public async addFriend(
    friendCode: string
  ): Promise<{ success: boolean; friend?: Friend; error?: string }> {
    // Validate friend code
    if (friendCode.length !== 8 || !friendCode.startsWith('POT')) {
      return { success: false, error: 'Invalid friend code' };
    }

    // Check if already friends
    const existingFriend = this.friends.find((f) => f.id === friendCode);
    if (existingFriend) {
      return { success: false, error: 'Already friends with this player' };
    }

    // Mock adding friend (in production, this would call your backend)
    const newFriend: Friend = {
      id: friendCode,
      username: `Player${Math.floor(Math.random() * 9999)}`,
      level: Math.floor(Math.random() * 50) + 1,
      lastPlayed: new Date(),
      highScore: Math.floor(Math.random() * 100000),
      status: Math.random() > 0.5 ? 'online' : 'offline',
    };

    this.friends.push(newFriend);
    await this.saveSocialData();

    return { success: true, friend: newFriend };
  }

  public async removeFriend(friendId: string): Promise<boolean> {
    const index = this.friends.findIndex((f) => f.id === friendId);
    if (index !== -1) {
      this.friends.splice(index, 1);
      await this.saveSocialData();
      return true;
    }
    return false;
  }

  public getFriends(): Friend[] {
    return this.friends;
  }

  public getOnlineFriends(): Friend[] {
    return this.friends.filter((f) => f.status === 'online');
  }

  // Challenge system
  public async createChallenge(
    friendId: string,
    type: 'score' | 'coins' | 'survival' | 'combo',
    target: number,
    reward: number
  ): Promise<{ success: boolean; challenge?: Challenge; error?: string }> {
    const friend = this.friends.find((f) => f.id === friendId);
    if (!friend) {
      return { success: false, error: 'Friend not found' };
    }

    // Check for existing active challenge
    const existingChallenge = this.challenges.find(
      (c) => c.challengedId === friendId && c.status === 'active'
    );
    if (existingChallenge) {
      return { success: false, error: 'Already have an active challenge with this friend' };
    }

    const challenge: Challenge = {
      id: `challenge_${Date.now()}`,
      challengerId: this.currentUserId,
      challengerName: 'You',
      challengedId: friendId,
      challengedName: friend.username,
      type,
      target,
      reward,
      status: 'pending',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      createdAt: new Date(),
    };

    this.challenges.push(challenge);
    await this.saveSocialData();

    return { success: true, challenge };
  }

  public async acceptChallenge(challengeId: string): Promise<boolean> {
    const challenge = this.challenges.find((c) => c.id === challengeId);
    if (!challenge || challenge.status !== 'pending') {
      return false;
    }

    challenge.status = 'active';
    await this.saveSocialData();

    return true;
  }

  public async completeChallenge(challengeId: string, won: boolean): Promise<number> {
    const challenge = this.challenges.find((c) => c.id === challengeId);
    if (!challenge || challenge.status !== 'active') {
      return 0;
    }

    challenge.status = 'completed';
    await this.saveSocialData();

    return won ? challenge.reward : 0;
  }

  public getChallenges(): Challenge[] {
    // Filter out expired challenges
    const now = new Date();
    return this.challenges.filter((c) => c.expiresAt > now);
  }

  public getActiveChallenges(): Challenge[] {
    return this.challenges.filter((c) => c.status === 'active');
  }

  // Statistics
  public getSocialStats() {
    return {
      friendsCount: this.friends.length,
      onlineFriends: this.getOnlineFriends().length,
      shareCount: this.shareCount,
      invitesSent: this.invitesSent,
      challengesWon: this.challenges.filter((c) => c.status === 'completed').length,
      referralCode: this.referralCode,
    };
  }

  // Facebook/Google integration (mock)
  public async connectFacebook(): Promise<{ success: boolean; error?: string }> {
    // Mock Facebook connection
    // In production, use Facebook SDK
    return { success: true };
  }

  public async connectGoogle(): Promise<{ success: boolean; error?: string }> {
    // Mock Google connection
    // In production, use Google Sign-In
    return { success: true };
  }

  public async inviteFacebookFriends(): Promise<{
    success: boolean;
    count?: number;
    error?: string;
  }> {
    // Mock Facebook invite
    // In production, use Facebook SDK
    const count = Math.floor(Math.random() * 10) + 1;
    this.invitesSent += count;
    await this.saveSocialData();

    return { success: true, count };
  }
}

export const socialManager = new SocialManager();
