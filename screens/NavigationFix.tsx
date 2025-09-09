// Navigation Route Mapping
// This file documents all available routes and their purposes

export const NAVIGATION_ROUTES = {
  // Core Screens (Always Available)
  HOME: 'Home',
  GAME: 'Game',
  GAME_OVER: 'GameOver',
  AUTH: 'Auth',
  
  // Onboarding Flow
  LEGAL_AGREEMENT: 'LegalAgreement',
  ONBOARDING: 'Onboarding',
  
  // Shop & Customization
  SHOP: 'Shop',
  SKIN_SHOP: 'SkinShop',
  LOCKER: 'Locker',
  
  // Stats & Social
  LEADERBOARD: 'Leaderboard',
  STATS: 'Stats',
  
  // Settings & Info
  SETTINGS: 'Settings',
  HOW_TO_PLAY: 'HowToPlay',
  
  // Admin
  ADMIN_PANEL: 'AdminPanel',
  
  // Screens that need to be implemented or mapped
  // These are referenced in code but not yet available:
  STORE: 'Shop', // Maps to Shop
  BUY_GOLD: 'Shop', // Maps to Shop (coin packages section)
  UPGRADE: 'Shop', // Maps to Shop (upgrades section)
  CHALLENGE_FRIENDS: 'Leaderboard', // Social features via leaderboard
  MISSIONS: 'Home', // Not implemented yet
  SEASON_PASS: 'Shop', // Future feature
  SUBSCRIPTION_VAULT: 'Shop', // Future feature
  CAMP: 'Home', // Not implemented
  DATA_REQUEST: 'Settings', // Privacy settings
  DELETE_ACCOUNT: 'Settings', // Account management
  MANAGE_CONSENT: 'Settings', // Privacy settings
} as const;

// Helper function to safely navigate
export const safeNavigate = (navigation: any, routeName: string) => {
  // Map old route names to new ones
  const routeMap: Record<string, string> = {
    'Store': 'Shop',
    'BuyGold': 'Shop',
    'Upgrade': 'Shop',
    'ChallengeFriends': 'Leaderboard',
    'Missions': 'Home',
    'SeasonPass': 'Shop',
    'SubscriptionVault': 'Shop',
    'Camp': 'Home',
    'DataRequest': 'Settings',
    'DeleteAccount': 'Settings',
    'ManageConsent': 'Settings',
  };
  
  const actualRoute = routeMap[routeName] || routeName;
  
  try {
    navigation.navigate(actualRoute);
  } catch (error) {
    console.warn(`Navigation to ${routeName} (mapped to ${actualRoute}) failed:`, error);
    // Fallback to Home if route doesn't exist
    navigation.navigate('Home');
  }
};