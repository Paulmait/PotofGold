/**
 * Simple Firestore initialization
 * Creates collections that are allowed by security rules
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Your Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyBJSp7vX2-SOWCpjbgTEAPj_T9QQL72JX4',
  authDomain: 'potofgold-production.firebaseapp.com',
  projectId: 'potofgold-production',
  storageBucket: 'potofgold-production.firebasestorage.app',
  messagingSenderId: '511446280789',
  appId: '1:511446280789:web:f52cfd9a863631ad0b82dc',
  measurementId: 'G-GFP64LBLZ3',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function initializeFirestore() {
  console.log('🔥 FIREBASE FIRESTORE INITIALIZER');
  console.log('Project: potofgold-production\n');
  console.log('🚀 Creating initial collections...\n');

  try {
    // 1. Create legal_audit collection (allowed by rules: anyone can create)
    console.log('📝 Creating legal_audit collection...');
    const legalAuditRef = collection(db, 'legal_audit');
    const legalDoc = await addDoc(legalAuditRef, {
      userId: 'INIT_USER_001',
      userEmail: 'init@potofgold.com',
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

    // 2. Create legal_audit_anonymous (allowed by rules: anyone can create)
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

    console.log('\n' + '='.repeat(60));
    console.log('🎉 FIRESTORE INITIALIZATION COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📊 Collections created:');
    console.log('   ✅ legal_audit');
    console.log('   ✅ legal_audit_anonymous');
    console.log('\n📍 View your data at:');
    console.log(
      '   https://console.firebase.google.com/project/potofgold-production/firestore/data'
    );
    console.log('\n💡 Additional collections will be created when:');
    console.log('   • Users sign up (users collection)');
    console.log('   • Users make purchases (purchase_audit)');
    console.log('   • Users play games (game_data)');
    console.log('   • Admin configures settings (config)');
  } catch (error) {
    console.error('\n❌ Error:', error.message);

    if (error.code === 'permission-denied') {
      console.log('\n⚠️  Make sure you have published the security rules in Firebase Console:');
      console.log(
        '   1. Go to: https://console.firebase.google.com/project/potofgold-production/firestore/rules'
      );
      console.log('   2. Copy the rules from firestore.rules file');
      console.log('   3. Click "Publish"');
      console.log('   4. Wait 1-2 minutes for rules to propagate');
      console.log('   5. Run this script again');
    }
  }

  process.exit();
}

// Run the initialization
initializeFirestore();
