// TypeScript fixes for third-party libraries and global types

// Fix for react-native-vector-icons
declare module 'react-native-vector-icons/Ionicons' {
  import { Icon } from 'react-native-vector-icons/Icon';
  export default Icon;
}

// Fix for Firebase imports
declare module 'firebase/auth' {
  export const getAuth: any;
  export const onAuthStateChanged: any;
  export const signInWithEmailAndPassword: any;
  export const createUserWithEmailAndPassword: any;
  export const signOut: any;
  export const sendPasswordResetEmail: any;
  export const updateProfile: any;
  export const User: any;
  export const Auth: any;
}

declare module 'firebase/firestore' {
  export const getFirestore: any;
  export const doc: any;
  export const getDoc: any;
  export const setDoc: any;
  export const updateDoc: any;
  export const deleteDoc: any;
  export const collection: any;
  export const query: any;
  export const where: any;
  export const orderBy: any;
  export const limit: any;
  export const getDocs: any;
  export const onSnapshot: any;
  export const serverTimestamp: any;
  export const increment: any;
  export const arrayUnion: any;
  export const arrayRemove: any;
  export const addDoc: any;
  export const Firestore: any;
}

declare module 'firebase/storage' {
  export const getStorage: any;
  export const ref: any;
  export const uploadBytes: any;
  export const getDownloadURL: any;
  export const deleteObject: any;
}

declare module 'firebase/app' {
  export const initializeApp: any;
  export const getApps: any;
  export const getApp: any;
}

// Fix for react-native-web-linear-gradient
declare module 'react-native-web-linear-gradient' {
  import { Component } from 'react';
  import { ViewProps } from 'react-native';
  
  interface LinearGradientProps extends ViewProps {
    colors: string[];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    locations?: number[];
  }
  
  export default class LinearGradient extends Component<LinearGradientProps> {}
}

// Fix for HTML5 Audio on web
declare global {
  interface Window {
    Audio: {
      new(src?: string): HTMLAudioElement;
    };
  }
}

// Fix for PWA types
declare global {
  interface Navigator {
    standalone?: boolean;
    maxTouchPoints: number;
    hardwareConcurrency: number;
  }
  
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  }
}

// Fix for animationDelay in styles
declare module 'react-native' {
  interface ViewStyle {
    animationDelay?: string;
  }
}

// Fix timeout types
type TimeoutID = ReturnType<typeof setTimeout>;
type IntervalID = ReturnType<typeof setInterval>;

export {};