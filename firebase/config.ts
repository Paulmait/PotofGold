import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getFunctions } from 'firebase/functions';

// Declare process.env types
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_FIREBASE_API_KEY?: string;
      EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
      EXPO_PUBLIC_FIREBASE_PROJECT_ID?: string;
      EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET?: string;
      EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string;
      EXPO_PUBLIC_FIREBASE_APP_ID?: string;
      EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID?: string;
      FIREBASE_API_KEY?: string;
      FIREBASE_AUTH_DOMAIN?: string;
      FIREBASE_PROJECT_ID?: string;
      FIREBASE_STORAGE_BUCKET?: string;
      FIREBASE_MESSAGING_SENDER_ID?: string;
      FIREBASE_APP_ID?: string;
      FIREBASE_MEASUREMENT_ID?: string;
    }
  }
}

// Firebase configuration from environment variables
// CRITICAL: Never commit real API keys to source control
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || "",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID || ""
};

// Validate configuration
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error('Firebase configuration is incomplete. Please check your environment variables.');
}

// Initialize Firebase (prevent duplicate app error in tests)
import { getApps } from 'firebase/app';
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize services
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const db = firestore; // Alias for compatibility
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