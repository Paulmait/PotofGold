import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Export all Cloud Functions
export {
  scheduleMonthlyDrop,
  triggerMonthlyDropSwitch,
  checkMonthlyDropConsistency,
} from './monthlyDrop';
