# Gold Vault Club Subscription System

## Overview
The Gold Vault Club is a premium monthly subscription offering exclusive perks and benefits to Pot of Gold players. Built with RevenueCat for cross-platform subscription management.

## Setup Instructions

### 1. Environment Configuration

Create a `.env` file from `.env.example` and add your RevenueCat API keys:

```bash
REVENUECAT_API_KEY_IOS=your_ios_api_key_here
REVENUECAT_API_KEY_ANDROID=your_android_api_key_here
REVENUECAT_ENTITLEMENT_ID=gold_vault
REVENUECAT_OFFERING_ID=default
REVENUECAT_PRODUCT_ID=pog_monthly_usd_4_99
```

### 2. RevenueCat Dashboard Setup

1. Create products in App Store Connect and Google Play Console:
   - iOS Product ID: `com.cienrios.potofgold.goldvault.monthly`
   - Android Product ID: `gold_vault_monthly`
   - Price: $4.99 USD (or local equivalent)

2. Configure in RevenueCat:
   - Create entitlement: `gold_vault`
   - Create offering: `default`
   - Add package: `monthly` → link to store products

3. Enable server-to-server notifications for real-time updates

### 3. App Store Configuration

#### iOS (App Store Connect)
1. Create subscription group: "Gold Vault Club"
2. Add auto-renewable subscription
3. Set up promotional offers (optional)
4. Configure App Store Server Notifications URL (RevenueCat webhook)

#### Android (Google Play Console)
1. Create subscription: `gold_vault_monthly`
2. Set billing period: Monthly
3. Configure grace period: 3 days
4. Set up Real-time Developer Notifications

## Product IDs

| Environment | Platform | Product ID | Price |
|------------|----------|------------|-------|
| Production | iOS | `com.cienrios.potofgold.goldvault.monthly` | $4.99 |
| Production | Android | `gold_vault_monthly` | $4.99 |
| Sandbox | iOS | Same as production | $0.00 |
| Test | Android | `android.test.purchased` | $0.00 |

## Features & Perks

### Gold Vault Club Benefits
1. **Daily Gold Bonus**: 500 coins every 24 hours
2. **2x Unlock Speed**: Double progression for states and skins
3. **Exclusive Monthly Drop**: Unique skin + trail each month
4. **VIP Badge**: Display on leaderboards and profile
5. **Early Access**: Beta features and new content
6. **Ad-Free**: No interstitial or banner ads

## Implementation Details

### Core Components

#### 1. RevenueCat Service (`src/lib/revenuecat.ts`)
- Handles initialization and API communication
- Manages purchase flow and restoration
- Implements 7-day offline cache for entitlements

#### 2. Entitlement Hooks (`src/features/subscriptions/`)
- `useEntitlements`: Core subscription state management
- `useDailyBonus`: Daily reward claiming logic
- `useUnlockMultiplier`: 2x speed multiplier application

#### 3. UI Components
- `SubscriptionVaultScreen`: Main subscription hub
- `PaywallModal`: Purchase flow interface
- `VIPBadge`: Visual indicator for subscribers

### Data Flow

```
User Action → RevenueCat API → Local Cache → Firebase Sync → UI Update
```

### Offline Support
- Entitlements cached for 7 days
- Grace period for network issues
- Cached state persists through app restarts

## Testing

### Local Development

1. **iOS Sandbox Testing**
   - Use Sandbox tester account
   - Enable `DEBUG` mode in Xcode
   - Purchases complete immediately, no charges

2. **Android Testing**
   - Use test account added in Play Console
   - Test cards: 4111 1111 1111 1111
   - License testing for specific responses

### QA Test Cases

#### Purchase Flow
- [ ] Fresh user can view paywall
- [ ] Price displays correctly (localized)
- [ ] Purchase completes successfully
- [ ] Perks activate immediately after purchase
- [ ] Receipt validation works

#### Restoration
- [ ] Restore purchases button works
- [ ] Previous purchases recovered
- [ ] Cross-device sync functions

#### Cancellation
- [ ] User can access management screen
- [ ] External cancellation reflected in app
- [ ] Grace period handled correctly

#### Edge Cases
- [ ] Network failure during purchase
- [ ] App crash during transaction
- [ ] Multiple rapid purchase attempts
- [ ] Expired card handling

### Debug Commands

```javascript
// Force refresh entitlements
await revenueCatService.getCustomerInfo();

// Clear cache (dev only)
await revenueCatService.clearCache();

// Check specific entitlement
const hasGoldVault = await revenueCatService.checkEntitlement('gold_vault');

// Sync purchases (sandbox)
await revenueCatService.syncPurchases();
```

## Analytics Events

Track these events for subscription funnel analysis:

| Event | Properties | Trigger |
|-------|------------|---------|
| `paywall_viewed` | `source`, `userId` | Modal opened |
| `purchase_initiated` | `productId`, `price` | Subscribe tapped |
| `purchase_completed` | `productId`, `revenue` | Success |
| `purchase_failed` | `reason`, `productId` | Error |
| `subscription_cancelled` | `userId`, `reason` | Cancelled |
| `daily_bonus_claimed` | `amount`, `streak` | Bonus claimed |

## Troubleshooting

### Common Issues

#### "Products not loading"
- Verify API keys in `.env`
- Check RevenueCat dashboard configuration
- Ensure products approved in stores

#### "Purchase fails immediately"
- Check bundle ID matches store listing
- Verify user not already subscribed
- Confirm sandbox/production environment

#### "Entitlements not updating"
- Force refresh: `await refresh()`
- Check Firebase sync permissions
- Verify RevenueCat webhook configuration

### Debug Logs

Enable verbose logging:
```javascript
Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
```

Check logs for:
- `[Purchases]` - SDK operations
- `[RevenueCat]` - API responses
- `[Entitlements]` - State changes

## Security Notes

1. **Never expose API keys in client code**
2. **Validate receipts server-side for sensitive operations**
3. **Implement rate limiting for bonus claims**
4. **Use HTTPS for all API communications**
5. **Rotate API keys periodically**

## Support Contacts

- RevenueCat Support: support@revenuecat.com
- App Store Review: https://developer.apple.com/contact/
- Play Console Support: https://support.google.com/googleplay/android-developer

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-15 | Initial implementation |
| 1.0.1 | TBD | Bug fixes and optimizations |