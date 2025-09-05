import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyBJSp7vX2-SOWCpjbgTEAPj_T9QQL72JX4",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "potofgold-production.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "potofgold-production",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "potofgold-production.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "511446280789",
  appId: process.env.FIREBASE_APP_ID || "1:511446280789:web:f52cfd9a863631ad0b82dc",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-GFP64LBLZ3"
};

// Initialize Firebase (prevent duplicate app error in tests)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

export default app; 