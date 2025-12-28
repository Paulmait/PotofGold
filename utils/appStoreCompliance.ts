import { Platform } from 'react-native';

export interface AgeRating {
  age: number;
  content: string[];
  description: string;
}

export interface StoreRequirements {
  privacyPolicy: string;
  termsOfService: string;
  supportEmail: string;
  website: string;
  ageRating: AgeRating;
}

export class AppStoreCompliance {
  private static instance: AppStoreCompliance;
  private requirements: StoreRequirements;

  static getInstance(): AppStoreCompliance {
    if (!AppStoreCompliance.instance) {
      AppStoreCompliance.instance = new AppStoreCompliance();
    }
    return AppStoreCompliance.instance;
  }

  constructor() {
    this.requirements = {
      privacyPolicy: 'https://cienrios.com/potofgold/privacy',
      termsOfService: 'https://cienrios.com/potofgold/terms',
      supportEmail: 'support@cienrios.com',
      website: 'https://cienrios.com/potofgold',
      ageRating: {
        age: 4,
        content: ['No Violence', 'No Adult Content', 'In-App Purchases'],
        description: 'Suitable for all ages. Contains optional in-app purchases.',
      },
    };
  }

  // Age-appropriate content filtering
  isContentAppropriate(userAge: number, contentType: string): boolean {
    if (userAge < 13) {
      // COPPA compliance for users under 13
      return this.isCOPPACompliant(contentType);
    }
    return true;
  }

  private isCOPPACompliant(contentType: string): boolean {
    const coppaRestricted = [
      'personalized_ads',
      'data_collection',
      'social_features',
      'chat',
      'user_generated_content',
    ];
    return !coppaRestricted.includes(contentType);
  }

  // App Store metadata
  getAppStoreMetadata() {
    return {
      name: 'Pot of Gold',
      subtitle: 'Catch falling coins in this addictive mobile game!',
      description: `
🎮 Pot of Gold - The Ultimate Coin Catching Adventure!

Catch falling coins, collect power-ups, and challenge friends in this addictive mobile game! Perfect for players of all ages.

✨ FEATURES:
• Smooth touch controls for precise coin catching
• Multiple power-ups: Magnet, Double Points, Slow Motion, Gold Rush
• Challenge friends to 60-second competitive matches
• Real-time leaderboards and achievements
• Beautiful graphics and satisfying sound effects
• Watch ads to earn coins - no purchase required!

🏆 GAME MODES:
• Single Player: Endless gameplay with increasing difficulty
• Challenge Mode: 60-second competitive matches
• Multiplayer: Real-time friend challenges

💰 MONETIZATION:
• Watch rewarded ads to earn coins
• Optional in-app purchases for premium upgrades
• No pay-to-win mechanics
• Fair and balanced gameplay

🔒 PRIVACY & SAFETY:
• COPPA compliant for children under 13
• GDPR/CCPA compliant data handling
• No personal data collection from children
• Parental controls and privacy settings

🎯 PERFECT FOR:
• Casual gamers looking for quick fun
• Families with children (4+ age rating)
• Players who enjoy skill-based games
• Anyone who loves collecting and achieving goals

Download now and start your coin-catching adventure! 🪙✨
      `,
      keywords: [
        'game',
        'casual',
        'puzzle',
        'arcade',
        'coins',
        'collecting',
        'family',
        'kids',
        'fun',
        'addictive',
        'challenge',
        'multiplayer',
      ],
      category: 'Games',
      subcategory: 'Arcade',
      ageRating: '4+',
      contentRating: 'Everyone',
      languages: ['English'],
      price: 'Free',
      inAppPurchases: [
        'Remove Ads ($1.99)',
        'Premium Power-ups ($2.99)',
        'Coin Packages ($0.99 - $14.99)',
      ],
    };
  }

  // Google Play Store metadata
  getPlayStoreMetadata() {
    return {
      name: 'Pot of Gold',
      shortDescription: 'Catch falling coins in this addictive mobile game!',
      fullDescription: `
🎮 Pot of Gold - The Ultimate Coin Catching Adventure!

Catch falling coins, collect power-ups, and challenge friends in this addictive mobile game! Perfect for players of all ages.

✨ FEATURES:
• Smooth touch controls for precise coin catching
• Multiple power-ups: Magnet, Double Points, Slow Motion, Gold Rush
• Challenge friends to 60-second competitive matches
• Real-time leaderboards and achievements
• Beautiful graphics and satisfying sound effects
• Watch ads to earn coins - no purchase required!

🏆 GAME MODES:
• Single Player: Endless gameplay with increasing difficulty
• Challenge Mode: 60-second competitive matches
• Multiplayer: Real-time friend challenges

💰 MONETIZATION:
• Watch rewarded ads to earn coins
• Optional in-app purchases for premium upgrades
• No pay-to-win mechanics
• Fair and balanced gameplay

🔒 PRIVACY & SAFETY:
• COPPA compliant for children under 13
• GDPR/CCPA compliant data handling
• No personal data collection from children
• Parental controls and privacy settings

🎯 PERFECT FOR:
• Casual gamers looking for quick fun
• Families with children (4+ age rating)
• Players who enjoy skill-based games
• Anyone who loves collecting and achieving goals

Download now and start your coin-catching adventure! 🪙✨
      `,
      category: 'Arcade',
      tags: [
        'casual',
        'puzzle',
        'arcade',
        'family',
        'kids',
        'fun',
        'addictive',
        'challenge',
        'multiplayer',
        'coins',
        'collecting',
      ],
      contentRating: 'Everyone',
      targetAudience: 'Everyone',
      price: 'Free',
      inAppPurchases: [
        'Remove Ads ($1.99)',
        'Premium Power-ups ($2.99)',
        'Coin Packages ($0.99 - $14.99)',
      ],
    };
  }

  // Privacy compliance
  getPrivacyCompliance() {
    return {
      gdpr: {
        dataProcessing: 'Legitimate Interest',
        dataRetention: 'Until account deletion',
        userRights: [
          'Right to access',
          'Right to rectification',
          'Right to erasure',
          'Right to data portability',
        ],
        dataCategories: [
          'Game progress and scores',
          'Device information',
          'Analytics data (anonymized)',
          'Purchase history',
        ],
      },
      ccpa: {
        dataCategories: ['Personal identifiers', 'Commercial information', 'Internet activity'],
        optOutMethods: ['In-app settings', 'Email request', 'Privacy policy link'],
      },
      coppa: {
        parentalConsent: 'Required for users under 13',
        dataCollection: 'Minimal and necessary only',
        parentalControls: 'Available in settings',
        noPersonalizedAds: 'For users under 13',
      },
    };
  }

  // Content guidelines compliance
  getContentGuidelines() {
    return {
      violence: 'None',
      sexualContent: 'None',
      language: 'Family-friendly',
      substances: 'None',
      gambling: 'None',
      userGeneratedContent: 'None',
      socialFeatures: 'Friend challenges only',
      chat: 'None',
      multiplayer: 'Score comparison only',
    };
  }

  // Monetization compliance
  getMonetizationCompliance() {
    return {
      adDisclosure: 'Clear disclosure of ad-based rewards',
      purchaseDisclosure: 'Clear pricing and item descriptions',
      noPayToWin: 'All purchases are cosmetic or convenience',
      adFrequency: 'Limited to 1 ad per 2 minutes',
      rewardAds: 'Optional and clearly labeled',
      parentalControls: 'Available for in-app purchases',
    };
  }

  // Technical requirements
  getTechnicalRequirements() {
    return {
      minimumOS: Platform.OS === 'ios' ? 'iOS 12.0' : 'Android 6.0',
      targetOS: Platform.OS === 'ios' ? 'iOS 15.0+' : 'Android 10.0+',
      permissions: ['Internet access (for ads and multiplayer)', 'Storage (for game data)'],
      optionalPermissions: [
        'Camera (for profile pictures)',
        'Microphone (for voice chat - future feature)',
      ],
      accessibility: [
        'VoiceOver/TalkBack support',
        'High contrast mode',
        'Large text support',
        'Reduced motion support',
      ],
    };
  }

  // Store-specific requirements
  getStoreRequirements(store: 'appstore' | 'playstore') {
    const base = {
      privacyPolicy: this.requirements.privacyPolicy,
      termsOfService: this.requirements.termsOfService,
      supportEmail: this.requirements.supportEmail,
      website: this.requirements.website,
      ageRating: this.requirements.ageRating,
    };

    if (store === 'appstore') {
      return {
        ...base,
        appStoreReviewGuidelines: 'Compliant',
        familySharing: 'Enabled',
        inAppPurchaseReview: 'Required',
        appPrivacy: 'Detailed privacy labels',
      };
    } else {
      return {
        ...base,
        playStorePolicies: 'Compliant',
        familyLibrary: 'Enabled',
        inAppPurchaseReview: 'Required',
        dataSafety: 'Detailed data safety section',
      };
    }
  }
}

export const appStoreCompliance = AppStoreCompliance.getInstance();
