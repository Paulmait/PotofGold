// Test configuration for local development
// This allows testing without Firebase configuration

export const TEST_MODE = true;

export const testConfig = {
  // Mock Firebase config for testing
  firebase: {
    apiKey: "test-api-key",
    authDomain: "test.firebaseapp.com",
    projectId: "test-project",
    storageBucket: "test.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:test"
  },
  
  // Mock Sentry config for testing
  sentry: {
    dsn: null, // Disable in test mode
  },
  
  // Test user for development
  testUser: {
    uid: "test-user-123",
    email: "test@potofgold.com",
    displayName: "Test Player"
  },
  
  // Enable offline mode
  offlineMode: true,
  
  // Skip authentication
  skipAuth: true
};