# Monthly Drops System Documentation

## Overview

The Monthly Drops system provides exclusive cosmetic bundles to Gold Vault Club subscribers on a monthly basis. Each drop includes a cart skin, trail, badge, frame, and bonus coins - all themed around the current month.

## Architecture

### Data Flow

```
JSON Files (Static) → Drop Catalog → Firestore (Current ID) → Drop Service → UI
                                           ↓
                                    Cloud Function (Monthly Switch)
```

### Key Components

1. **Drop Catalog** (`src/features/drops/dropCatalog.ts`)
   - Loads static JSON files at build time
   - Maps drop IDs to drop data
   - Calculates claim windows

2. **Drop Service** (`src/features/drops/dropService.ts`)
   - Manages Firestore integration
   - Handles claim transactions
   - Updates user inventory
   - Provides offline caching

3. **useDrop Hook** (`src/features/drops/useDrop.ts`)
   - React hook for UI components
   - Manages loading states
   - Handles claim flow
   - Auto-refreshes data

4. **Cloud Functions** (`functions/src/monthlyDrop.ts`)
   - Scheduled monthly switch
   - Manual override capabilities
   - Consistency checking

## Adding New Monthly Drops

### Step 1: Create the JSON File

Create a new file in `assets/drops/` following the naming pattern `month_YYYY_MM.json`:

```json
{
  "id": "drop_2026_08",
  "monthLabel": "August 2026",
  "cartSkinId": "cart_summer_gold_v1",
  "trailId": "trail_sunburst_v1",
  "badgeId": "badge_august_elite_v1",
  "frameId": "frame_golden_sun_v1",
  "bonusCoins": 1000,
  "claimWindowDays": 45,
  "previewArt": {
    "cartSkinPng": "assets/previews/cart_summer_gold_v1.png",
    "trailPng": "assets/previews/trail_sunburst_v1.png",
    "badgePng": "assets/previews/badge_august_elite_v1.png",
    "framePng": "assets/previews/frame_golden_sun_v1.png"
  }
}
```

### Step 2: Update the Calendar

Add the new file to `assets/drops/calendar.json`:

```json
{
  "months": [
    // ... existing months
    "month_2026_08.json"
  ]
}
```

### Step 3: Import in Drop Catalog

Update `src/features/drops/dropCatalog.ts`:

```typescript
import drop_2026_08 from '../../../assets/drops/month_2026_08.json';

// Add to the allDrops array
const allDrops = [
  // ... existing drops
  drop_2026_08,
];
```

### Step 4: Create Preview Assets

Place preview images in `assets/previews/` with matching filenames:

- `cart_summer_gold_v1.png`
- `trail_sunburst_v1.png`
- `badge_august_elite_v1.png`
- `frame_golden_sun_v1.png`

### Step 5: Validate

Run schema validation:

```bash
npx ajv validate -s assets/drops/schema/monthly_drop.schema.json \
  -d assets/drops/month_2026_08.json
```

## Claim Flow

### User Experience

1. User opens Subscription Vault screen
2. Current month's drop is displayed with 3D preview
3. If subscribed and not claimed:
   - "Claim Now" button is active
4. User taps claim button
5. Transaction runs:
   - Verifies subscription
   - Creates claim record
   - Updates inventory
   - Grants coins
6. Success animation plays
7. Items appear in Shop/Locker as "Owned"

### Technical Flow

```typescript
// 1. Check entitlement
const isSubscribed = await revenueCatService.getCustomerInfo();

// 2. Run Firestore transaction
await runTransaction(db, async (transaction) => {
  // Create claim record
  transaction.set(claimRef, {
    userId,
    dropId,
    claimedAt: Date.now(),
    granularity: 'monthly',
  });

  // Update inventory
  inventory.skins.push(drop.cartSkinId);
  inventory.trails.push(drop.trailId);
  inventory.badges.push(drop.badgeId);
  inventory.frames.push(drop.frameId);
  inventory.coins += drop.bonusCoins;

  transaction.set(inventoryRef, inventory);
});
```

## Deployment

### Initial Setup

1. **Deploy Cloud Functions**

```bash
cd functions
npm install
npm run deploy
```

2. **Initialize Firestore**

```bash
# Create initial config document
firebase firestore:set config/current '{"currentDropId":"drop_2025_08","claimWindowDays":45}'
```

3. **Deploy Security Rules**

```bash
firebase deploy --only firestore:rules
```

### Monthly Operations

The system automatically switches drops on the 1st of each month at 00:00 ET via the scheduled Cloud Function.

### Manual Override

If needed, trigger manually:

```bash
# Switch to specific drop
curl -X GET "https://us-central1-potofgold.cloudfunctions.net/triggerMonthlyDropSwitch?dropId=drop_2025_09" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Auto-detect current month
curl -X GET "https://us-central1-potofgold.cloudfunctions.net/triggerMonthlyDropSwitch" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Consistency Check

Verify the current drop matches the current month:

```bash
curl -X GET "https://us-central1-potofgold.cloudfunctions.net/checkMonthlyDropConsistency"
```

## Testing

### Unit Tests

```typescript
// Test claim logic
describe('DropService', () => {
  it('should prevent duplicate claims', async () => {
    const result1 = await dropService.claimCurrentDrop();
    expect(result1.success).toBe(true);

    const result2 = await dropService.claimCurrentDrop();
    expect(result2.success).toBe(false);
    expect(result2.error).toBe('Drop already claimed');
  });

  it('should require subscription', async () => {
    // Mock non-subscriber
    jest.spyOn(revenueCatService, 'getCustomerInfo').mockResolvedValue(null);

    const result = await dropService.claimCurrentDrop();
    expect(result.success).toBe(false);
    expect(result.error).toBe('Subscription required');
  });
});
```

### E2E Tests (Detox)

```typescript
describe('Subscription Vault', () => {
  it('should claim monthly drop', async () => {
    // Navigate to vault
    await element(by.id('settings-button')).tap();
    await element(by.id('gold-vault-button')).tap();

    // Claim drop
    await expect(element(by.id('claim-button'))).toBeVisible();
    await element(by.id('claim-button')).tap();

    // Verify claimed
    await expect(element(by.text('Claimed!'))).toBeVisible();

    // Check inventory
    await element(by.id('back-button')).tap();
    await element(by.id('locker-button')).tap();
    await expect(element(by.id('owned-badge'))).toBeVisible();
  });
});
```

## Monitoring

### Key Metrics

- Monthly Active Claimers
- Claim Rate (claims / eligible subscribers)
- Time to Claim (from availability to claim)
- Drop Engagement Rate

### Alerts

- Set up Firebase alerts for:
  - Failed monthly switches
  - Claim transaction failures
  - Unusual claim patterns (potential exploits)

### Analytics Events

```typescript
// Track in your analytics service
analytics.track('monthly_drop_viewed', {
  dropId: currentDrop.id,
  isSubscribed: true,
  isClaimed: false,
});

analytics.track('monthly_drop_claimed', {
  dropId: currentDrop.id,
  daysIntoMonth: daysRemaining,
  itemsGranted: 4,
  coinsGranted: 1000,
});
```

## Troubleshooting

### Drop Not Switching

1. Check Cloud Function logs
2. Verify scheduler is running
3. Run consistency check
4. Manual override if needed

### Claim Failures

1. Check user's subscription status
2. Verify Firestore permissions
3. Check for existing claim record
4. Review transaction logs

### Missing Inventory

1. Check offline cache
2. Verify Firestore sync
3. Force refresh inventory
4. Check security rules

## Legal Compliance

### Required Disclosures

- "Content is cosmetic only"
- "Subscription required to claim"
- "Available for limited time"
- "No gameplay advantage provided"

### Store Compliance

- No gambling mechanics
- Clear value proposition
- Transparent timing
- Easy cancellation

## Future Enhancements

### Planned Features

- [ ] Preview animations in 3D
- [ ] Trading between users
- [ ] Seasonal mega-drops
- [ ] Retroactive claiming for new subscribers
- [ ] Drop voting system

### Technical Improvements

- [ ] CDN for preview assets
- [ ] Real-time claim notifications
- [ ] Batch claim for multiple months
- [ ] Analytics dashboard
- [ ] A/B testing framework
