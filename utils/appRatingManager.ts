import { Platform, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import Constants from 'expo-constants';

interface RatingConfig {
  minSessionsBeforePrompt: number;
  minDaysBeforePrompt: number;
  minScoreBeforePrompt: number;
  daysBeforeReminder: number;
  maxPromptsPerVersion: number;
  significantEvents: string[];
}

interface RatingData {
  firstLaunchDate: string;
  totalSessions: number;
  hasRated: boolean;
  lastPromptDate?: string;
  promptCount: number;
  appVersion: string;
  declinedDate?: string;
  significantEventCounts: { [event: string]: number };
}

class AppRatingManager {
  private config: RatingConfig = {
    minSessionsBeforePrompt: 3,
    minDaysBeforePrompt: 2,
    minScoreBeforePrompt: 1000,
    daysBeforeReminder: 30,
    maxPromptsPerVersion: 2,
    significantEvents: [
      'level_completed',
      'achievement_unlocked',
      'high_score_achieved',
      'purchase_completed',
      'friend_invited',
    ],
  };
  
  private ratingData: RatingData;
  private isInitialized: boolean = false;
  
  constructor() {
    this.ratingData = this.getDefaultRatingData();
    this.initialize();
  }
  
  private getDefaultRatingData(): RatingData {
    return {
      firstLaunchDate: new Date().toISOString(),
      totalSessions: 0,
      hasRated: false,
      promptCount: 0,
      appVersion: Constants.expoConfig?.version || '1.0.0',
      significantEventCounts: {},
    };
  }
  
  private async initialize() {
    try {
      const storedData = await AsyncStorage.getItem('app_rating_data');
      if (storedData) {
        this.ratingData = JSON.parse(storedData);
        
        // Check if app version changed
        const currentVersion = Constants.expoConfig?.version || '1.0.0';
        if (this.ratingData.appVersion !== currentVersion) {
          // Reset prompt count for new version
          this.ratingData.promptCount = 0;
          this.ratingData.appVersion = currentVersion;
          await this.saveRatingData();
        }
      } else {
        // First launch
        await this.saveRatingData();
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing app rating:', error);
    }
  }
  
  private async saveRatingData() {
    try {
      await AsyncStorage.setItem('app_rating_data', JSON.stringify(this.ratingData));
    } catch (error) {
      console.error('Error saving rating data:', error);
    }
  }
  
  public async incrementSession() {
    if (!this.isInitialized) await this.initialize();
    
    this.ratingData.totalSessions++;
    await this.saveRatingData();
  }
  
  public async trackSignificantEvent(event: string) {
    if (!this.isInitialized) await this.initialize();
    
    if (!this.config.significantEvents.includes(event)) return;
    
    if (!this.ratingData.significantEventCounts[event]) {
      this.ratingData.significantEventCounts[event] = 0;
    }
    
    this.ratingData.significantEventCounts[event]++;
    await this.saveRatingData();
    
    // Check if we should prompt after this event
    await this.checkAndPromptForRating(event);
  }
  
  private shouldPromptForRating(): boolean {
    if (this.ratingData.hasRated) return false;
    if (this.ratingData.promptCount >= this.config.maxPromptsPerVersion) return false;
    
    // Check minimum sessions
    if (this.ratingData.totalSessions < this.config.minSessionsBeforePrompt) return false;
    
    // Check minimum days since first launch
    const daysSinceFirstLaunch = this.getDaysSince(this.ratingData.firstLaunchDate);
    if (daysSinceFirstLaunch < this.config.minDaysBeforePrompt) return false;
    
    // Check days since last prompt or decline
    if (this.ratingData.lastPromptDate) {
      const daysSinceLastPrompt = this.getDaysSince(this.ratingData.lastPromptDate);
      if (daysSinceLastPrompt < this.config.daysBeforeReminder) return false;
    }
    
    if (this.ratingData.declinedDate) {
      const daysSinceDeclined = this.getDaysSince(this.ratingData.declinedDate);
      if (daysSinceDeclined < this.config.daysBeforeReminder * 2) return false;
    }
    
    return true;
  }
  
  private getDaysSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  
  public async checkAndPromptForRating(trigger?: string) {
    if (!this.shouldPromptForRating()) return false;
    
    // Additional checks based on trigger
    if (trigger === 'high_score_achieved') {
      // Show prompt immediately after high score
      return this.showRatingPrompt('achievement');
    } else if (trigger === 'level_completed') {
      // Show after completing certain levels
      const levelCompletions = this.ratingData.significantEventCounts['level_completed'] || 0;
      if (levelCompletions % 5 === 0) {
        return this.showRatingPrompt('milestone');
      }
    } else if (!trigger) {
      // Generic check (app launch, etc.)
      return this.showRatingPrompt('general');
    }
    
    return false;
  }
  
  private async showRatingPrompt(context: 'achievement' | 'milestone' | 'general'): Promise<boolean> {
    const messages = {
      achievement: {
        title: '🎉 Awesome Achievement!',
        message: 'You\'re doing great! Would you mind rating Pot of Gold to help other players discover this game?',
        positive: 'Rate Now',
        negative: 'Maybe Later',
      },
      milestone: {
        title: '🏆 Congratulations!',
        message: 'You\'ve reached an amazing milestone! If you\'re enjoying Pot of Gold, would you consider leaving a review?',
        positive: 'Sure, I\'ll Rate',
        negative: 'Not Now',
      },
      general: {
        title: '💛 Enjoying Pot of Gold?',
        message: 'We\'d love to hear your feedback! Would you take a moment to rate us on the App Store?',
        positive: 'Rate Pot of Gold',
        negative: 'Remind Me Later',
      },
    };
    
    const config = messages[context];
    
    return new Promise((resolve) => {
      Alert.alert(
        config.title,
        config.message,
        [
          {
            text: config.negative,
            style: 'cancel',
            onPress: async () => {
              this.ratingData.lastPromptDate = new Date().toISOString();
              this.ratingData.promptCount++;
              await this.saveRatingData();
              resolve(false);
            },
          },
          {
            text: config.positive,
            style: 'default',
            onPress: async () => {
              const success = await this.openRatingPage();
              if (success) {
                this.ratingData.hasRated = true;
                this.ratingData.lastPromptDate = new Date().toISOString();
                this.ratingData.promptCount++;
                await this.saveRatingData();
              }
              resolve(success);
            },
          },
          {
            text: 'Never Ask Again',
            style: 'destructive',
            onPress: async () => {
              this.ratingData.hasRated = true; // Treat as rated to never ask again
              this.ratingData.declinedDate = new Date().toISOString();
              await this.saveRatingData();
              resolve(false);
            },
          },
        ],
        { cancelable: true }
      );
    });
  }
  
  public async openRatingPage(): Promise<boolean> {
    try {
      // First try native in-app rating (iOS 10.3+ and Android 5+)
      if (await StoreReview.isAvailableAsync()) {
        await StoreReview.requestReview();
        return true;
      }
      
      // Fallback to opening store page
      const storeUrl = this.getStoreUrl();
      if (storeUrl) {
        const supported = await Linking.canOpenURL(storeUrl);
        if (supported) {
          await Linking.openURL(storeUrl);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error opening rating page:', error);
      return false;
    }
  }
  
  private getStoreUrl(): string | null {
    const appStoreId = Constants.expoConfig?.ios?.appStoreId || 'YOUR_APP_STORE_ID';
    const packageName = Constants.expoConfig?.android?.package || 'com.yourcompany.potofgold';
    
    if (Platform.OS === 'ios') {
      return `https://apps.apple.com/app/id${appStoreId}?action=write-review`;
    } else if (Platform.OS === 'android') {
      return `market://details?id=${packageName}`;
    }
    
    return null;
  }
  
  // Manual rating trigger (from settings, etc.)
  public async requestManualRating(): Promise<boolean> {
    return this.openRatingPage();
  }
  
  // Feedback form alternative
  public async showFeedbackForm(): Promise<void> {
    Alert.alert(
      '📝 Send Feedback',
      'We\'d love to hear your thoughts on how we can improve Pot of Gold!',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Email Feedback',
          onPress: () => {
            const email = 'feedback@potofgold.game';
            const subject = 'Pot of Gold Feedback';
            const body = `App Version: ${this.ratingData.appVersion}\nPlatform: ${Platform.OS}\n\nFeedback:\n`;
            
            Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`);
          },
        },
      ]
    );
  }
  
  // Analytics
  public getRatingStats() {
    return {
      hasRated: this.ratingData.hasRated,
      totalSessions: this.ratingData.totalSessions,
      promptCount: this.ratingData.promptCount,
      daysSinceFirstLaunch: this.getDaysSince(this.ratingData.firstLaunchDate),
      significantEvents: this.ratingData.significantEventCounts,
    };
  }
  
  // Reset (for testing)
  public async resetRatingData() {
    this.ratingData = this.getDefaultRatingData();
    await this.saveRatingData();
  }
}

export const appRatingManager = new AppRatingManager();