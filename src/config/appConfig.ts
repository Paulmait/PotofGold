/**
 * Pot of Gold - Application Configuration
 * Cien Rios LLC dba Pot of Gold
 */

export const APP_CONFIG = {
  // Company Information
  company: {
    name: 'Cien Rios LLC',
    dba: 'Pot of Gold',
    website: 'https://pofgold.com',
    supportEmail: 'support@pofgold.com',
    privacyEmail: 'privacy@pofgold.com',
    location: 'Miami, FL, USA',
  },

  // Legal URLs
  legal: {
    termsUrl: 'https://pofgold.com/terms',
    privacyUrl: 'https://pofgold.com/privacy',
    minAge: 13,
    governingLaw: 'State of Florida, United States',
    effectiveDate: 'August 22, 2025',
  },

  // App Store Information
  appStore: {
    ios: {
      bundleId: 'com.pofgold.potofgold',
      appId: '878598219',
      teamId: 'LFB9Z5Q3Y9',
    },
    android: {
      packageName: 'com.pofgold.potofgold',
      playStoreUrl: 'https://play.google.com/store/apps/details?id=com.pofgold.potofgold',
    },
  },

  // Subscription Information
  subscriptions: {
    proMembership: {
      name: 'Pro Membership',
      features: [
        'Remove ads',
        'Exclusive skins',
        'Double coins',
        'Early access to content',
        'VIP badge',
      ],
      pricing: {
        monthly: '$4.99',
        yearly: '$39.99',
      },
    },
  },

  // Game Settings
  game: {
    maxLevel: 100,
    startingCoins: 100,
    dailyBonusCoins: 50,
    adRewardCoins: 25,
    seasonalEvents: true,
    monthlyDrops: true,
  },

  // Feature Flags
  features: {
    inAppPurchases: true,
    subscriptions: true,
    ads: true,
    leaderboards: true,
    achievements: true,
    cloudSave: true,
    socialSharing: true,
  },

  // API Endpoints
  api: {
    baseUrl: 'https://api.pofgold.com',
    version: 'v1',
  },

  // Social Media
  social: {
    twitter: '@PotOfGoldGame',
    instagram: '@potofgoldgame',
    facebook: 'PotOfGoldGame',
    discord: 'https://discord.gg/potofgold',
  },
};

export default APP_CONFIG;