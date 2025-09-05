/**
 * Initialize Firestore with legal collections and sample data
 * Run this script to create the collections in Firebase
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// You'll need to download your service account key from Firebase Console
// Go to Project Settings → Service Accounts → Generate New Private Key
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'potofgold-production',
});

const db = admin.firestore();

async function initializeFirestore() {
  console.log('🚀 Initializing Firestore collections...\n');

  try {
    // 1. Create sample legal_audit document
    const legalAuditRef = db.collection('legal_audit');
    await legalAuditRef.add({
      userId: 'SAMPLE_USER_001',
      userEmail: 'sample@example.com',
      timestamp: new Date().toISOString(),
      acceptanceType: 'initial',
      documentsAccepted: {
        termsOfService: true,
        privacyPolicy: true,
        eula: true,
      },
      legalVersion: '2.0',
      deviceId: 'SAMPLE_DEVICE_001',
      scrolledDocuments: true,
      timeSpentReading: 120,
      platform: 'web',
      appVersion: '1.0.0',
      serverTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      clientTimestamp: new Date().toISOString(),
      userAgent: 'Sample User Agent',
    });
    console.log('✅ Created legal_audit collection with sample document');

    // 2. Create sample legal_audit_anonymous document
    const anonRef = db.collection('legal_audit_anonymous');
    await anonRef.add({
      deviceId: 'ANON_DEVICE_001',
      timestamp: new Date().toISOString(),
      acceptanceType: 'initial',
      documentsAccepted: {
        termsOfService: true,
        privacyPolicy: true,
        eula: true,
      },
      legalVersion: '2.0',
      scrolledDocuments: true,
      timeSpentReading: 95,
      platform: 'mobile',
      appVersion: '1.0.0',
      serverTimestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('✅ Created legal_audit_anonymous collection with sample document');

    // 3. Create purchase_audit collection
    const purchaseRef = db.collection('purchase_audit');
    await purchaseRef.add({
      userId: 'SAMPLE_USER_001',
      timestamp: new Date().toISOString(),
      type: 'purchase',
      accepted: true,
      purchaseAmount: '4.99',
      itemDetails: {
        itemId: 'golden_cart',
        itemType: 'cart',
        price: { gems: 100 },
      },
      serverTimestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('✅ Created purchase_audit collection with sample document');

    // 4. Create users collection with legal flags
    const usersRef = db.collection('users');
    await usersRef.doc('SAMPLE_USER_001').set({
      email: 'sample@example.com',
      displayName: 'Sample User',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      legalAcceptance: {
        accepted: true,
        version: '2.0',
        timestamp: new Date().toISOString(),
      },
      role: 'user',
      coins: 1000,
      gems: 50,
    });
    console.log('✅ Created users collection with sample user');

    // 5. Create config collection for app settings
    const configRef = db.collection('config');
    await configRef.doc('legal_version').set({
      current: '2.0',
      minRequired: '2.0',
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      forceReacceptance: false,
    });
    console.log('✅ Created config collection with legal version');

    console.log('\n🎉 Firestore initialization complete!');
    console.log('📍 View your data at: https://console.firebase.google.com/project/potofgold-production/firestore/data');

  } catch (error) {
    console.error('❌ Error initializing Firestore:', error);
  }

  process.exit();
}

// Run the initialization
initializeFirestore();