# Gold Vault Club Subscription System

## Overview

The Gold Vault Club is a premium subscription offering for Pot of Gold that provides exclusive perks, enhanced gameplay, and monthly content drops.

## Features

### Core Benefits

- **500 Daily Gold Coins**: Claim once every 24 hours
- **2x Unlock Speed**: Progress twice as fast through content
- **Exclusive Monthly Drops**: New skins, trails, and badges every month
- **VIP Badge**: Stand out on leaderboards
- **Ad-Free Experience**: Uninterrupted gameplay
- **Early Access**: Try new features before everyone else

### Technical Implementation

#### RevenueCat Integration

- SDK: `react-native-purchases` v7.28.1
- Entitlement: `gold_vault`
- Product ID: `com.cienrios.potofgold.goldvault.monthly`
- Price: $4.99/month (auto-renewable)

#### Key Components

1. **Subscription Hooks**
   - `useEntitlements()`: Check subscription status
   - `useDailyBonus()`: Manage daily coin claims
   - `useUnlockMultiplier()`: Apply 2x progression speed

2. **Monthly Drops System**
   - Location: `src/features/subscriptions/monthlyDropsService.ts`
   - Content: JSON files in `assets/drops/`
   - Auto-grant to active subscribers

3. **UI Components**
   - `SubscriptionVaultScreen`: Main subscription hub
   - `PaywallModal`: Purchase flow
   - `SettingsScreen`: Subscription management

### Responsive Design

- Optimized for phones (< 768px) and tablets (>= 768px)
- Touch controls for pot movement
- Pan gesture support for smooth gameplay

## Setup

### Environment Variables

Create a `.env` file with:

```
REVENUECAT_API_KEY_IOS=your_ios_key
REVENUECAT_API_KEY_ANDROID=your_android_key
FIREBASE_API_KEY=your_firebase_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

### RevenueCat Configuration

1. Create products in RevenueCat dashboard
2. Set up entitlement "gold_vault"
3. Configure offerings with monthly subscription
4. Enable server-to-server notifications

### App Store Setup

1. Create subscription group "Gold Vault Club"
2. Add auto-renewable subscription
3. Set localized pricing
4. Configure promotional offers (optional)

### Google Play Setup

1. Create subscription product
2. Configure base plan (monthly)
3. Enable grace period (3 days)
4. Set up real-time developer notifications

## Testing

### Local Testing

```bash
# Run type checking
npm run typecheck

# Run linting
npm run lint

# Run tests
npm test

# Format code
npm run format
```

### Subscription Testing

1. Use sandbox accounts (iOS)
2. Use test accounts (Android)
3. Test purchase, restore, and cancellation flows
4. Verify daily bonus claiming
5. Check multiplier application in gameplay

## CI/CD Pipeline

### GitHub Actions Workflows

- **CI Pipeline** (`.github/workflows/ci.yml`)
  - Code quality checks (ESLint, Prettier, TypeScript)
  - Unit tests with coverage
  - Security scanning
  - Builds for Android and iOS

- **Deploy Pipeline** (`.github/workflows/deploy.yml`)
  - Manual deployment to App Store/Google Play
  - Environment-specific builds
  - Slack notifications

### EAS Build Configuration

- Development: Debug builds with dev client
- Preview: Internal distribution APKs
- Production: Release builds for stores

## Monthly Content Updates

### Adding New Monthly Drops

1. Create JSON file in `assets/drops/month_YYYY_MM.json`
2. Include cart skin, trail, badge, and bonuses
3. Set availability dates and subscription requirement
4. Test auto-grant functionality

### Content Structure

```json
{
  "month": "2024_01",
  "displayName": "January 2024",
  "theme": "New Year Gold Rush",
  "drops": {
    "cartSkin": { ... },
    "trail": { ... },
    "badge": { ... },
    "bonusCoins": 1000,
    "bonusXpMultiplier": 1.5
  }
}
```

## Compliance

### Store Requirements

- Clear subscription terms displayed
- One-tap cancellation available
- Restore purchases functionality
- Privacy policy and terms of service links
- Parental controls for users under 13

### Legal Protection

- Arbitration clause in terms
- Liability limitations
- COPPA/GDPR compliance
- Transparent pricing
- No hidden fees

## Monitoring

### Analytics Events

- Subscription started
- Subscription cancelled
- Daily bonus claimed
- Monthly drop claimed
- Multiplier applied

### Key Metrics

- Conversion rate
- Retention rate
- Daily active subscribers
- Average revenue per user (ARPU)
- Churn rate

## Support

### Common Issues

1. **Subscription not recognized**: Use restore purchases
2. **Daily bonus not available**: Check 24-hour cooldown
3. **Monthly drop missing**: Verify active subscription
4. **Multiplier not applying**: Restart app

### Contact

- Email: support@cienrios.com
- In-app support: Settings > Support

## Future Enhancements

- [ ] Weekly challenges for subscribers
- [ ] Subscriber-only leaderboard
- [ ] Gifting subscriptions
- [ ] Annual plan with discount
- [ ] Referral rewards program
