/**
 * Direct Firestore initialization using your app's Firebase config
 * This creates the collections and sample data
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  addDoc, 
  setDoc, 
  doc,
  serverTimestamp 
} = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Your Firebase configuration (same as in your app)
const firebaseConfig = {
  apiKey: "AIzaSyBJSp7vX2-SOWCpjbgTEAPj_T9QQL72JX4",
  authDomain: "potofgold-production.firebaseapp.com",
  projectId: "potofgold-production",
  storageBucket: "potofgold-production.firebasestorage.app",
  messagingSenderId: "511446280789",
  appId: "1:511446280789:web:f52cfd9a863631ad0b82dc",
  measurementId: "G-GFP64LBLZ3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function initializeFirestore() {
  console.log('🚀 Initializing Firestore collections...\n');

  try {
    // First, try to authenticate as the admin user
    console.log('🔐 Authenticating as admin...');
    try {
      await signInWithEmailAndPassword(auth, 'guampaul@gmail.com', process.env.ADMIN_PASSWORD || 'your-password-here');
      console.log('✅ Authenticated successfully');
    } catch (authError) {
      console.log('⚠️  Could not authenticate. Creating anonymous data...');
    }

    // 1. Create sample legal_audit document
    console.log('\n📝 Creating legal_audit collection...');
    const legalAuditRef = collection(db, 'legal_audit');
    const legalDoc = await addDoc(legalAuditRef, {
      userId: auth.currentUser?.uid || 'SAMPLE_USER_001',
      userEmail: auth.currentUser?.email || 'sample@example.com',
      timestamp: new Date().toISOString(),
      acceptanceType: 'initial',
      documentsAccepted: {
        termsOfService: true,
        privacyPolicy: true,
        eula: true,
      },
      legalVersion: '2.0',
      deviceId: 'INIT_DEVICE_001',
      scrolledDocuments: true,
      timeSpentReading: 120,
      platform: 'web',
      appVersion: '1.0.0',
      serverTimestamp: serverTimestamp(),
      clientTimestamp: new Date().toISOString(),
      userAgent: 'Initialization Script',
    });
    console.log('✅ Created legal_audit document with ID:', legalDoc.id);

    // 2. Create sample legal_audit_anonymous document
    console.log('\n📝 Creating legal_audit_anonymous collection...');
    const anonRef = collection(db, 'legal_audit_anonymous');
    const anonDoc = await addDoc(anonRef, {
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
      serverTimestamp: serverTimestamp(),
    });
    console.log('✅ Created legal_audit_anonymous document with ID:', anonDoc.id);

    // 3. Create purchase_audit collection
    console.log('\n📝 Creating purchase_audit collection...');
    const purchaseRef = collection(db, 'purchase_audit');
    const purchaseDoc = await addDoc(purchaseRef, {
      userId: auth.currentUser?.uid || 'SAMPLE_USER_001',
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
    console.log('✅ Created purchase_audit document with ID:', purchaseDoc.id);

    // 4. Create or update users collection
    if (auth.currentUser) {
      console.log('\n📝 Updating user document...');
      const usersRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(usersRef, {
        email: auth.currentUser.email,
        displayName: auth.currentUser.displayName || 'Pot of Gold Player',
        legalAcceptance: {
          accepted: true,
          version: '2.0',
          timestamp: new Date().toISOString(),
        },
        role: 'user',
        coins: 1000,
        gems: 50,
        createdAt: serverTimestamp(),
      }, { merge: true });
      console.log('✅ Updated user document');
    }

    // 5. Create config collection for app settings
    console.log('\n📝 Creating config collection...');
    const configRef = doc(db, 'config', 'legal_version');
    await setDoc(configRef, {
      current: '2.0',
      minRequired: '2.0',
      lastUpdated: serverTimestamp(),
      forceReacceptance: false,
    });
    console.log('✅ Created config document');

    // 6. Create sample game_data
    console.log('\n📝 Creating game_data collection...');
    const gameDataRef = doc(db, 'game_data', auth.currentUser?.uid || 'SAMPLE_USER_001');
    await setDoc(gameDataRef, {
      highScore: 5000,
      totalCoins: 10000,
      gamesPlayed: 50,
      achievements: ['first_game', 'coin_collector', 'speed_demon'],
      lastPlayed: serverTimestamp(),
    });
    console.log('✅ Created game_data document');

    console.log('\n' + '='.repeat(60));
    console.log('🎉 FIRESTORE INITIALIZATION COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📍 View your data at:');
    console.log('   https://console.firebase.google.com/project/potofgold-production/firestore/data\n');
    console.log('📊 Collections created:');
    console.log('   • legal_audit');
    console.log('   • legal_audit_anonymous');
    console.log('   • purchase_audit');
    console.log('   • users');
    console.log('   • config');
    console.log('   • game_data\n');

  } catch (error) {
    console.error('\n❌ Error initializing Firestore:', error.message);
    console.error('\nFull error:', error);
    
    if (error.code === 'permission-denied') {
      console.log('\n⚠️  Permission denied. This might be because:');
      console.log('   1. Firestore security rules are blocking writes');
      console.log('   2. You need to authenticate first');
      console.log('   3. The project settings need to be updated');
      console.log('\n💡 Try running this script after deploying your app and authenticating.');
    }
  }

  process.exit();
}

// Run the initialization
console.log('🔥 FIREBASE FIRESTORE INITIALIZER');
console.log('Project: potofgold-production\n');
initializeFirestore();