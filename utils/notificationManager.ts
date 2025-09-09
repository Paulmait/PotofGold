import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationPreferences {
  enabled: boolean;
  dailyReminder: boolean;
  eventNotifications: boolean;
  friendActivity: boolean;
  specialOffers: boolean;
  reminderTime: string; // HH:MM format
}

interface ScheduledNotification {
  id: string;
  type: 'daily' | 'event' | 'offer' | 'friend' | 'streak' | 'energy';
  title: string;
  body: string;
  data?: any;
  scheduledTime: Date;
}

class NotificationManager {
  private pushToken: string | null = null;
  private preferences: NotificationPreferences;
  private scheduledNotifications: Map<string, string> = new Map(); // type -> notification ID
  private notificationListener: any = null;
  private responseListener: any = null;
  
  constructor() {
    this.preferences = {
      enabled: true,
      dailyReminder: true,
      eventNotifications: true,
      friendActivity: true,
      specialOffers: true,
      reminderTime: '20:00', // 8 PM default
    };
    
    this.initialize();
  }
  
  private async initialize() {
    try {
      // Load preferences
      const savedPrefs = await AsyncStorage.getItem('notification_preferences');
      if (savedPrefs) {
        this.preferences = { ...this.preferences, ...JSON.parse(savedPrefs) };
      }
      
      // Register for push notifications
      if (this.preferences.enabled) {
        await this.registerForPushNotifications();
        await this.scheduleDefaultNotifications();
      }
      
      // Set up notification listeners
      this.setupNotificationListeners();
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }
  
  private async registerForPushNotifications() {
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return;
    }
    
    try {
      // Get existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push notification permissions');
        return;
      }
      
      // Get push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.expoConfig?.extra?.projectId;
      const tokenData = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );
      
      this.pushToken = tokenData.data;
      console.log('Push token:', this.pushToken);
      
      // Configure channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FFD700',
          sound: 'default',
        });
        
        await Notifications.setNotificationChannelAsync('daily', {
          name: 'Daily Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
        });
        
        await Notifications.setNotificationChannelAsync('events', {
          name: 'Events & Challenges',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }
      
      return this.pushToken;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }
  
  private setupNotificationListeners() {
    // Handle notifications when app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // You can show custom in-app notification here
    });
    
    // Handle notification taps
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      this.handleNotificationResponse(response);
    });
  }
  
  private handleNotificationResponse(response: Notifications.NotificationResponse) {
    const { notification } = response;
    const data = notification.request.content.data;
    
    // Handle different notification types
    switch (data?.type) {
      case 'daily':
        // Open game
        break;
      case 'event':
        // Open events screen
        break;
      case 'friend':
        // Open friends screen
        break;
      case 'offer':
        // Open shop
        break;
      case 'streak':
        // Open daily rewards
        break;
      default:
        // Open app normally
        break;
    }
  }
  
  // Schedule notifications
  private async scheduleDefaultNotifications() {
    if (!this.preferences.enabled) return;
    
    // Cancel existing scheduled notifications
    await this.cancelAllScheduledNotifications();
    
    // Schedule daily reminder
    if (this.preferences.dailyReminder) {
      await this.scheduleDailyReminder();
    }
    
    // Schedule streak reminder
    await this.scheduleStreakReminder();
    
    // Schedule energy full notification
    await this.scheduleEnergyFullNotification();
    
    // Schedule weekend event notification
    await this.scheduleWeekendEvent();
  }
  
  private async scheduleDailyReminder() {
    const [hours, minutes] = this.preferences.reminderTime.split(':').map(Number);
    
    const trigger = {
      hour: hours,
      minute: minutes,
      repeats: true,
    };
    
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🏆 Your treasures await!',
        body: 'Come back to Pot of Gold and continue your adventure!',
        data: { type: 'daily' },
        sound: 'default',
        badge: 1,
      },
      trigger,
    });
    
    this.scheduledNotifications.set('daily', id);
  }
  
  private async scheduleStreakReminder() {
    // Schedule for tomorrow at 7 PM if streak is active
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(19, 0, 0, 0);
    
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔥 Keep your streak alive!',
        body: 'Login now to maintain your daily streak and claim rewards!',
        data: { type: 'streak' },
        sound: 'default',
      },
      trigger: {
        date: tomorrow,
      },
    });
    
    this.scheduledNotifications.set('streak', id);
  }
  
  private async scheduleEnergyFullNotification() {
    // Schedule when energy is full (example: 2 hours)
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚡ Energy Full!',
        body: 'Your energy is fully recharged. Time to play!',
        data: { type: 'energy' },
      },
      trigger: {
        seconds: 2 * 60 * 60, // 2 hours
      },
    });
    
    this.scheduledNotifications.set('energy', id);
  }
  
  private async scheduleWeekendEvent() {
    // Schedule for Friday evening
    const nextFriday = new Date();
    const dayOfWeek = nextFriday.getDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
    nextFriday.setDate(nextFriday.getDate() + daysUntilFriday);
    nextFriday.setHours(18, 0, 0, 0);
    
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Weekend Event Started!',
        body: 'Double rewards all weekend! Play now for bonus coins!',
        data: { type: 'event' },
        sound: 'default',
      },
      trigger: {
        date: nextFriday,
      },
    });
    
    this.scheduledNotifications.set('weekend', id);
  }
  
  // Send instant notifications
  public async sendLocalNotification(
    title: string,
    body: string,
    data?: any,
    delay?: number
  ): Promise<string | null> {
    if (!this.preferences.enabled) return null;
    
    try {
      const trigger = delay ? { seconds: delay } : null;
      
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger,
      });
      
      return id;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  }
  
  // Friend activity notifications
  public async notifyFriendActivity(friendName: string, activity: string) {
    if (!this.preferences.friendActivity) return;
    
    await this.sendLocalNotification(
      '👥 Friend Activity',
      `${friendName} ${activity}`,
      { type: 'friend', friendName }
    );
  }
  
  // Special offer notifications
  public async notifySpecialOffer(offerTitle: string, discount: string) {
    if (!this.preferences.specialOffers) return;
    
    await this.sendLocalNotification(
      `💎 ${offerTitle}`,
      `Limited time offer: ${discount} off! Tap to view.`,
      { type: 'offer' }
    );
  }
  
  // Achievement notifications
  public async notifyAchievement(achievement: string) {
    if (!this.preferences.eventNotifications) return;
    
    await this.sendLocalNotification(
      '🏆 Achievement Unlocked!',
      `You've earned: ${achievement}`,
      { type: 'achievement' }
    );
  }
  
  // Challenge notifications
  public async notifyChallenge(challengerName: string) {
    if (!this.preferences.friendActivity) return;
    
    await this.sendLocalNotification(
      '⚔️ New Challenge!',
      `${challengerName} has challenged you! Tap to accept.`,
      { type: 'challenge' }
    );
  }
  
  // Preference management
  public async updatePreferences(prefs: Partial<NotificationPreferences>) {
    this.preferences = { ...this.preferences, ...prefs };
    
    try {
      await AsyncStorage.setItem('notification_preferences', JSON.stringify(this.preferences));
      
      // Reschedule notifications if needed
      if (prefs.enabled !== undefined || prefs.dailyReminder !== undefined) {
        await this.scheduleDefaultNotifications();
      }
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    }
  }
  
  public getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }
  
  public async setEnabled(enabled: boolean) {
    await this.updatePreferences({ enabled });
    
    if (enabled) {
      await this.registerForPushNotifications();
      await this.scheduleDefaultNotifications();
    } else {
      await this.cancelAllScheduledNotifications();
    }
  }
  
  // Cancel notifications
  public async cancelScheduledNotification(type: string) {
    const id = this.scheduledNotifications.get(type);
    if (id) {
      await Notifications.cancelScheduledNotificationAsync(id);
      this.scheduledNotifications.delete(type);
    }
  }
  
  public async cancelAllScheduledNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
    this.scheduledNotifications.clear();
  }
  
  // Badge management
  public async setBadgeCount(count: number) {
    if (Platform.OS === 'ios') {
      await Notifications.setBadgeCountAsync(count);
    }
  }
  
  public async clearBadge() {
    await this.setBadgeCount(0);
  }
  
  // Get push token
  public getPushToken(): string | null {
    return this.pushToken;
  }
  
  // Cleanup
  public cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

export const notificationManager = new NotificationManager();