/**
 * Naming Standards
 * Centralized naming conventions for consistency across the app
 */

// App Information
export const APP_INFO = {
  NAME: 'Pot of Gold',
  TAGLINE: 'The Ultimate Coin Catching Adventure',
  SUBTITLE: 'Catch falling coins in this addictive mobile game!',
  VERSION: '1.0.0',
  BUILD: '100'
} as const;

// Screen Titles (for navigation headers)
export const SCREEN_TITLES = {
  HOME: 'Home',
  GAME: 'Game',
  SHOP: 'Shop',
  STORE: 'Store',
  LOCKER: 'My Locker',
  CAMP: 'Camp',
  MISSIONS: 'Missions',
  LEADERBOARD: 'Leaderboard',
  STATS: 'Statistics',
  SETTINGS: 'Settings',
  LEGAL: 'Legal',
  AUTH: 'Sign In',
  SKIN_SHOP: 'State Skins',
  SUBSCRIPTION_VAULT: 'Gold Vault Club',
  STATE_COLLECTION: 'State Collection',
  SEASON_PASS: 'Season Pass',
  BUY_GOLD: 'Buy Gold',
  UPGRADE: 'Upgrade',
  CHALLENGE_FRIENDS: 'Challenge Friends',
  DATA_REQUEST: 'Data Request',
  DELETE_ACCOUNT: 'Delete Account',
  MANAGE_CONSENT: 'Manage Consent',
  WELCOME: 'Welcome'
} as const;

// Currency Names
export const CURRENCY_NAMES = {
  SINGULAR: {
    COINS: 'coin',
    GEMS: 'gem',
    GOLD: 'gold'
  },
  PLURAL: {
    COINS: 'coins',
    GEMS: 'gems',
    GOLD: 'gold'
  },
  DISPLAY: {
    COINS: 'Coins',
    GEMS: 'Gems',
    GOLD: 'Gold'
  }
} as const;

// Item Categories
export const ITEM_CATEGORIES = {
  CARTS: {
    SINGULAR: 'cart',
    PLURAL: 'carts',
    DISPLAY: 'Carts',
    DESCRIPTION: 'Customize your pot with unique cart designs'
  },
  TRAILS: {
    SINGULAR: 'trail',
    PLURAL: 'trails',
    DISPLAY: 'Trails',
    DESCRIPTION: 'Add magical effects to your movement'
  },
  BADGES: {
    SINGULAR: 'badge',
    PLURAL: 'badges',
    DISPLAY: 'Badges',
    DESCRIPTION: 'Show off your achievements'
  },
  FRAMES: {
    SINGULAR: 'frame',
    PLURAL: 'frames',
    DISPLAY: 'Frames',
    DESCRIPTION: 'Decorate your profile with unique frames'
  },
  SKINS: {
    SINGULAR: 'skin',
    PLURAL: 'skins',
    DISPLAY: 'Skins',
    DESCRIPTION: 'Change your appearance with themed skins'
  }
} as const;

// Rarity Names
export const RARITY_NAMES = {
  COMMON: {
    NAME: 'Common',
    COLOR: '#757575',
    DESCRIPTION: 'Basic items available to all players'
  },
  UNCOMMON: {
    NAME: 'Uncommon',
    COLOR: '#4CAF50',
    DESCRIPTION: 'Slightly rare items with enhanced effects'
  },
  RARE: {
    NAME: 'Rare',
    COLOR: '#2196F3',
    DESCRIPTION: 'Hard to find items with special properties'
  },
  EPIC: {
    NAME: 'Epic',
    COLOR: '#9C27B0',
    DESCRIPTION: 'Extremely rare items with powerful effects'
  },
  LEGENDARY: {
    NAME: 'Legendary',
    COLOR: '#FFD700',
    DESCRIPTION: 'The rarest items with incredible abilities'
  },
  SEASONAL: {
    NAME: 'Seasonal',
    COLOR: '#FF6B6B',
    DESCRIPTION: 'Limited-time items from special events'
  }
} as const;

// Action Names
export const ACTION_NAMES = {
  // Purchase Actions
  BUY: 'Buy',
  PURCHASE: 'Purchase',
  UNLOCK: 'Unlock',
  EQUIP: 'Equip',
  UNEQUIP: 'Unequip',
  
  // Game Actions
  PLAY: 'Play',
  PAUSE: 'Pause',
  RESUME: 'Resume',
  RESTART: 'Restart',
  QUIT: 'Quit',
  
  // Navigation Actions
  BACK: 'Back',
  NEXT: 'Next',
  CONTINUE: 'Continue',
  SKIP: 'Skip',
  CANCEL: 'Cancel',
  CONFIRM: 'Confirm',
  
  // Collection Actions
  COLLECT: 'Collect',
  CLAIM: 'Claim',
  OPEN: 'Open',
  VIEW: 'View',
  SHARE: 'Share'
} as const;

// Status Messages
export const STATUS_MESSAGES = {
  SUCCESS: {
    PURCHASE: 'Purchase Successful!',
    UNLOCK: 'Item Unlocked!',
    EQUIP: 'Item Equipped!',
    ACHIEVEMENT: 'Achievement Unlocked!',
    LEVEL_UP: 'Level Up!',
    SAVE: 'Progress Saved!'
  },
  ERROR: {
    PURCHASE: 'Purchase Failed',
    INSUFFICIENT_FUNDS: 'Insufficient Funds',
    NETWORK: 'Network Error',
    GENERIC: 'Something went wrong',
    SAVE: 'Failed to save progress'
  },
  INFO: {
    LOADING: 'Loading...',
    SAVING: 'Saving...',
    CONNECTING: 'Connecting...',
    SYNCING: 'Syncing...'
  }
} as const;

// Achievement Names
export const ACHIEVEMENT_NAMES = {
  FIRST_PLAY: 'First Steps',
  COIN_COLLECTOR: 'Coin Collector',
  SPEED_DEMON: 'Speed Demon',
  PERFECT_GAME: 'Perfect Game',
  DAILY_PLAYER: 'Daily Player',
  WEEKLY_WARRIOR: 'Weekly Warrior',
  MASTER_COLLECTOR: 'Master Collector',
  STATE_CHAMPION: 'State Champion',
  LEGENDARY_PLAYER: 'Legendary Player'
} as const;

// Upgrade Names
export const UPGRADE_NAMES = {
  POT_SIZE: {
    NAME: 'Pot Size',
    DESCRIPTION: 'Increase the size of your pot to catch more coins'
  },
  POT_SPEED: {
    NAME: 'Pot Speed',
    DESCRIPTION: 'Move your pot faster to catch more coins'
  },
  MAGNET_RANGE: {
    NAME: 'Magnet Range',
    DESCRIPTION: 'Attract coins from further away'
  },
  COIN_VALUE: {
    NAME: 'Coin Value',
    DESCRIPTION: 'Earn more coins from each collection'
  },
  BONUS_CHANCE: {
    NAME: 'Bonus Chance',
    DESCRIPTION: 'Increase chance of bonus coins spawning'
  },
  SPECIAL_ITEMS: {
    NAME: 'Special Items',
    DESCRIPTION: 'Unlock access to rare power-ups and bonuses'
  }
} as const;

// Subscription Names
export const SUBSCRIPTION_NAMES = {
  GOLD_VAULT_CLUB: {
    NAME: 'Gold Vault Club',
    DESCRIPTION: 'Premium membership with exclusive benefits',
    SHORT_NAME: 'Gold Vault',
    BENEFITS: [
      'Daily 500 coin bonus',
      'Monthly Pro Drops',
      'Exclusive skins',
      'Priority support'
    ]
  }
} as const;

// Feature Names
export const FEATURE_NAMES = {
  DAILY_BONUS: 'Daily Bonus',
  MONTHLY_DROP: 'Monthly Pro Drop',
  SEASON_PASS: 'Season Pass',
  BATTLE_PASS: 'Battle Pass',
  ACHIEVEMENTS: 'Achievements',
  LEADERBOARDS: 'Leaderboards',
  SOCIAL_FEATURES: 'Social Features',
  FRIEND_CHALLENGES: 'Friend Challenges',
  STATE_COLLECTION: 'State Collection',
  MYSTERY_BOXES: 'Mystery Boxes'
} as const;

// Legal & Compliance
export const LEGAL_NAMES = {
  PRIVACY_POLICY: 'Privacy Policy',
  TERMS_OF_SERVICE: 'Terms of Service',
  EULA: 'End User License Agreement',
  DATA_REQUEST: 'Request My Data',
  DELETE_ACCOUNT: 'Delete My Account',
  MANAGE_CONSENT: 'Manage Data Consent',
  CONTACT_SUPPORT: 'Contact Support'
} as const;

// Helper functions for consistent naming
export function formatItemName(itemId: string): string {
  return itemId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatCurrency(amount: number, currency: keyof typeof CURRENCY_NAMES.PLURAL): string {
  const currencyName = amount === 1 
    ? CURRENCY_NAMES.SINGULAR[currency]
    : CURRENCY_NAMES.PLURAL[currency];
  
  return `${amount.toLocaleString()} ${currencyName}`;
}

export function getRarityInfo(rarity: keyof typeof RARITY_NAMES) {
  return RARITY_NAMES[rarity] || RARITY_NAMES.COMMON;
}

export function getActionButtonText(action: keyof typeof ACTION_NAMES, context?: string): string {
  const baseAction = ACTION_NAMES[action];
  if (!context) return baseAction;
  
  // Special cases for contextual button text
  switch (action) {
    case 'BUY':
      return `${baseAction} ${context}`;
    case 'EQUIP':
      return `${baseAction} ${context}`;
    case 'UNLOCK':
      return `${baseAction} ${context}`;
    default:
      return baseAction;
  }
}

// Validation function
export function validateNaming(): boolean {
  const issues: string[] = [];
  
  // Check for inconsistent naming patterns
  const screenTitleKeys = Object.keys(SCREEN_TITLES);
  screenTitleKeys.forEach(key => {
    const title = SCREEN_TITLES[key as keyof typeof SCREEN_TITLES];
    if (title.length === 0 || title.length > 50) {
      issues.push(`Screen title length issue: ${key} = "${title}"`);
    }
  });
  
  // Check for missing translations
  const requiredKeys = ['BUY', 'EQUIP', 'UNLOCK', 'CANCEL', 'CONFIRM'];
  requiredKeys.forEach(key => {
    if (!(key in ACTION_NAMES)) {
      issues.push(`Missing required action name: ${key}`);
    }
  });
  
  if (issues.length > 0) {
    console.warn('Naming validation issues:', issues);
    return false;
  }
  
  return true;
}

// Export naming validation
export const NAMING_VALID = validateNaming();