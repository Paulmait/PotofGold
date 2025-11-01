# Apple App Store Submission - Ready to Run Commands

## Step 1: Configure Firebase Secrets in EAS

Run these commands one by one (you're already logged into EAS):

```bash
# Configure Firebase API Key
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "AIzaSyBJSp7vX2-SOWCpjbgTEAPj_T9QQL72JX4"

# Configure Firebase Auth Domain
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "potofgold-production.firebaseapp.com"

# Configure Firebase Project ID
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "potofgold-production"

# Configure Firebase Storage Bucket
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "potofgold-production.firebasestorage.app"

# Configure Firebase Messaging Sender ID
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "511446280789"

# Configure Firebase App ID
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_APP_ID --value "1:511446280789:web:f52cfd9a863631ad0b82dc"

# Configure Firebase Measurement ID (Analytics)
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID --value "G-GFP64LBLZ3"
```

## Step 2: Build iOS App

```bash
# Start iOS production build
eas build --platform ios --profile production
```

This will:
- Build your app with all the fixes we made
- Use the Firebase credentials we just configured
- Auto-increment the build number
- Take approximately 15-20 minutes

## Step 3: Submit to Apple App Store

After the build completes successfully:

```bash
# Submit the latest build to App Store
eas submit --platform ios --latest
```

EAS will interactively prompt you for:
- App Store Connect App ID (if you don't have it, EAS can help you find it)
- Apple Team ID (EAS will show your available teams)
- Apple ID password (for authentication)

## Alternative: All-in-One Command

If you want to build and submit in one step:

```bash
eas build --platform ios --profile production --auto-submit
```

## Important Notes

✅ **What's Already Configured:**
- Apple ID: crazya1c@hotmail.com
- All Firebase credentials
- App compliance fixes (permissions, privacy, security)

⚠️ **What You'll Need During Submission:**
- Your Apple Developer account password
- App-specific password (if you use 2FA - generate at appleid.apple.com)
- App Store Connect App ID (EAS will help you find this)

🎯 **App Store Review Tips:**
- Age Rating: Set to **13+** in App Store Connect
- Privacy Labels: Mark Analytics, Device ID, Location (all with user consent)
- Category: Games > Casual or Games > Action
- Screenshots: Use the assets in your assets folder

## Troubleshooting

**If secrets fail to create:**
```bash
# List existing secrets
eas secret:list

# Delete old secret if it exists
eas secret:delete --name EXPO_PUBLIC_FIREBASE_API_KEY
```

**If build fails:**
- Check build logs in EAS dashboard
- Verify all secrets are configured correctly
- Run `eas build:list` to see build history

**If submission fails:**
- Verify your Apple Developer Program membership is active
- Check that your app bundle ID matches: com.pofgold.potofgold
- Ensure you have an app created in App Store Connect

## Next Steps After Submission

1. Monitor your email for App Store review status
2. Typically takes 24-48 hours for initial review
3. Be ready to respond to any reviewer questions
4. Set pricing and availability in App Store Connect
5. Prepare marketing materials and screenshots

---

**Ready to submit?** Start with Step 1 above! 🚀
