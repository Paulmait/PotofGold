/**
 * Initialize Firestore with sample data using client SDK
 * This can be run from the browser console after deploying
 */

// This script should be run in the browser console after your app is deployed
// Or you can create a temporary admin page to run it

const initializeFirestoreData = async () => {
  // Import Firebase (these will be available in your deployed app)
  const { db } = window.firebase || {};
  const { collection, addDoc, setDoc, doc, serverTimestamp } = window.firebase.firestore || {};

  if (!db) {
    console.error('Firebase not initialized. Make sure you are running this from your deployed app.');
    return;
  }

  console.log('🚀 Initializing Firestore collections...\n');

  try {
    // 1. Create sample legal_audit document
    const legalAuditRef = collection(db, 'legal_audit');
    const legalDoc = await addDoc(legalAuditRef, {
      userId: 'TEST_USER_' + Date.now(),
      userEmail: 'test@example.com',
      timestamp: new Date().toISOString(),
      acceptanceType: 'initial',
      documentsAccepted: {
        termsOfService: true,
        privacyPolicy: true,
        eula: true,
      },
      legalVersion: '2.0',
      deviceId: 'WEB_DEVICE_' + Date.now(),
      scrolledDocuments: true,
      timeSpentReading: 120,
      platform: 'web',
      appVersion: '1.0.0',
      serverTimestamp: serverTimestamp(),
      clientTimestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });
    console.log('✅ Created legal_audit document:', legalDoc.id);

    // 2. Create sample purchase_audit document
    const purchaseRef = collection(db, 'purchase_audit');
    const purchaseDoc = await addDoc(purchaseRef, {
      userId: 'TEST_USER_' + Date.now(),
      timestamp: new Date().toISOString(),
      type: 'purchase',
      accepted: true,
      purchaseAmount: '4.99',
      itemDetails: {
        itemId: 'golden_cart',
        itemType: 'cart',
        price: { gems: 100 },
      },
      serverTimestamp: serverTimestamp(),
    });
    console.log('✅ Created purchase_audit document:', purchaseDoc.id);

    console.log('\n🎉 Firestore initialization complete!');
    console.log('📍 View your data at: https://console.firebase.google.com/project/potofgold-production/firestore/data');
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error:', error);
    return { success: false, error };
  }
};

// If running in Node.js environment
if (typeof window === 'undefined') {
  console.log(`
  ⚠️  This script needs to be run in a browser environment.
  
  Option 1: Deploy your app and run in browser console
  Option 2: Use the Firebase Admin SDK script with a service account key
  
  To get your service account key:
  1. Go to: https://console.firebase.google.com/project/potofgold-production/settings/serviceaccounts/adminsdk
  2. Click "Generate New Private Key"
  3. Save as serviceAccountKey.json in the scripts folder
  4. Run: node initialize-firestore.js
  `);
} else {
  // Auto-run if loaded in browser
  initializeFirestoreData();
}