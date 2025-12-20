# Continue iOS Build - Ready When EAS Quota Resets

**Created:** December 20, 2025
**Quota Resets:** January 1, 2026
**Latest Code Commit:** `cabee0b` (all fixes included)

---

## Quick Start Command

When you're ready to build again, run:

```bash
npx eas build --platform ios --profile production --auto-submit --clear-cache
```

This will:
1. Clear cached builds
2. Build fresh iOS app with all fixes
3. Automatically submit to Apple App Store Connect

---

## What Was Fixed (Already Committed)

| Issue | Fix | File |
|-------|-----|------|
| main.jsbundle not found | Created proper entry point | `index.js` |
| Firebase ESM resolution | Added .mjs/.cjs support | `metro.config.js` |
| Invalid entryPoint config | Removed from app.json | `app.json` |
| Package main entry | Changed to index.js | `package.json` |
| Hardcoded credentials | Removed fallbacks | `firebase/firebase.ts` |
| Privacy defaults | Changed to opt-in | Privacy tests pass |

---

## Build Configuration

```
Bundle ID:      com.pofgold.potofgold
Version:        1.0.0
Build Number:   1.0.9 (auto-increments)
EAS Project:    f4c5b1f2-8541-4de2-b8d4-a57c60d96767
Team ID:        LFB9Z5Q3Y9 (CIEN RIOS, LLC)
```

---

## Monitoring Commands

```bash
# Check build status
npx eas build:list --platform ios

# View specific build
npx eas build:view [BUILD_ID]

# Check submission status
# Visit: https://appstoreconnect.apple.com/
```

---

## EAS Dashboard

- **Builds:** https://expo.dev/accounts/guampaul/projects/pot-of-gold/builds
- **Billing:** https://expo.dev/accounts/guampaul/settings/billing

---

## If Build Fails Again

1. Check the error logs:
   ```bash
   npx eas build:view [BUILD_ID]
   ```

2. Run local bundle test:
   ```bash
   npx react-native bundle --platform ios --dev false --entry-file index.js --bundle-output test.jsbundle
   ```

3. Common fixes:
   - Run `npx expo install --fix` for dependency issues
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check Metro config in `metro.config.js`

---

## After Successful Build

1. **App Store Connect** will receive the build automatically (--auto-submit)
2. Login at https://appstoreconnect.apple.com/
3. Complete the App Store listing:
   - Screenshots for all device sizes
   - App description and keywords
   - Privacy labels
   - Age rating (13+)
4. Submit for Apple Review

---

## Previous Build Errors (Now Fixed)

All these builds failed due to `main.jsbundle does not exist`:
- `4144c5d8` - Dec 20, 6:50 PM (old commit)
- `6655c31c` - Dec 20, 6:42 PM (old commit)
- `babbce0c` - Dec 20, 6:33 PM (old commit)

**Root cause:** Missing entry point and Metro config for Firebase ESM modules.
**Fix:** Committed in `cabee0b` - not yet built due to quota.

---

## Files Modified in This Session

```
index.js              - NEW: Entry point with registerRootComponent
metro.config.js       - UPDATED: Firebase ESM (.mjs/.cjs) support
package.json          - UPDATED: main set to index.js
app.json              - UPDATED: Removed invalid entryPoint
.gitignore            - UPDATED: Added patterns
```

---

## Contact

- **EAS Support:** https://docs.expo.dev/build/introduction/
- **Apple Review:** https://developer.apple.com/app-store/review/

---

**Ready to resume on January 1, 2026 or after upgrading EAS plan.**
