import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getFunctions } from 'firebase/functions';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyD-PLACEHOLDER',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'potofgold-demo.firebaseapp.com',
  projectId: process.env.FIREBASE_PROJECT_ID || 'potofgold-demo',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'potofgold-demo.appspot.com',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.FIREBASE_APP_ID || '1:123456789:web:abc123def456',
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || 'G-PLACEHOLDER'
};

// Initialize Firebase (prevent duplicate app error in tests)
import { getApps } from 'firebase/app';
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize services
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Initialize Analytics only if supported
let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { analytics };
export default app;