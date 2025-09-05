// Global type definitions and fixes

// Fix for Timeout type in React Native
declare global {
  type Timeout = ReturnType<typeof setTimeout>;
  type Interval = ReturnType<typeof setInterval>;
}

// Fix for Firebase imports
declare module 'firebase/auth' {
  export * from 'firebase/auth';
}

declare module 'firebase/firestore' {
  export * from 'firebase/firestore';
}

export {};