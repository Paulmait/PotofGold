import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const TZ = 'America/New_York';
const START_ID = 'drop_2025_08'; // safety fallback

/**
 * Scheduled function to update the current monthly drop
 * Runs on the 1st of each month at midnight ET
 */
export const scheduleMonthlyDrop = functions.pubsub
  .schedule('0 0 1 * *') // 1st of each month at 00:00
  .timeZone(TZ)
  .onRun(async (context) => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dropId = `drop_${yyyy}_${mm}`;

    const db = admin.firestore();
    const configRef = db.collection('config').doc('current');
    const dropsRef = db.collection('drops').doc(dropId);

    try {
      // Check if the drop exists (optional - you might store drops in Firestore)
      const dropSnapshot = await dropsRef.get();
      const exists = dropSnapshot.exists;
      const effectiveId = exists ? dropId : START_ID;

      // Update the current drop ID
      await configRef.set(
        {
          currentDropId: effectiveId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          claimWindowDays: 45,
          month: `${yyyy}-${mm}`,
          switchedAt: now.toISOString(),
        },
        { merge: true }
      );

      // Log the switch
      console.log(`Monthly drop switched to: ${effectiveId} at ${now.toISOString()}`);

      // Optional: Send notifications to users about new drop
      await notifyUsersAboutNewDrop(effectiveId);

      return `Successfully set currentDropId=${effectiveId}`;
    } catch (error) {
      console.error('Error switching monthly drop:', error);
      throw new functions.https.HttpsError('internal', `Failed to switch monthly drop: ${error}`);
    }
  });

/**
 * Manual trigger for testing or recovery
 * Can be called via Firebase console or CLI
 */
export const triggerMonthlyDropSwitch = functions.https.onRequest(async (req, res) => {
  // Verify admin authorization (add your own auth check)
  const authToken = req.headers.authorization;
  if (authToken !== `Bearer ${functions.config().admin?.token}`) {
    res.status(403).send('Unauthorized');
    return;
  }

  const dropId = (req.query.dropId as string) || null;
  const db = admin.firestore();
  const configRef = db.collection('config').doc('current');

  try {
    if (dropId) {
      // Manual override with specific drop ID
      await configRef.set(
        {
          currentDropId: dropId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          claimWindowDays: 45,
          manualOverride: true,
          overrideAt: new Date().toISOString(),
        },
        { merge: true }
      );

      res.json({ success: true, dropId, message: 'Manually switched drop' });
    } else {
      // Auto-detect current month
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const autoDropId = `drop_${yyyy}_${mm}`;

      await configRef.set(
        {
          currentDropId: autoDropId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          claimWindowDays: 45,
          month: `${yyyy}-${mm}`,
          manualOverride: false,
        },
        { merge: true }
      );

      res.json({ success: true, dropId: autoDropId, message: 'Auto-switched to current month' });
    }
  } catch (error) {
    console.error('Error in manual trigger:', error);
    res.status(500).json({ error: 'Failed to switch drop', details: error });
  }
});

/**
 * Function to check and auto-fix if the scheduler missed a month
 */
export const checkMonthlyDropConsistency = functions.https.onRequest(async (req, res) => {
  const db = admin.firestore();
  const configRef = db.collection('config').doc('current');

  try {
    const configSnap = await configRef.get();
    const config = configSnap.data();

    if (!config || !config.currentDropId) {
      // No config exists, initialize with current month
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dropId = `drop_${yyyy}_${mm}`;

      await configRef.set({
        currentDropId: dropId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        claimWindowDays: 45,
        initialized: true,
      });

      res.json({
        status: 'initialized',
        dropId,
        message: 'Config initialized with current month',
      });
      return;
    }

    // Check if current drop matches current month
    const now = new Date();
    const currentYYYY = now.getFullYear();
    const currentMM = String(now.getMonth() + 1).padStart(2, '0');
    const expectedDropId = `drop_${currentYYYY}_${currentMM}`;

    if (config.currentDropId !== expectedDropId) {
      // Mismatch detected, log warning but don't auto-fix without confirmation
      res.json({
        status: 'mismatch',
        current: config.currentDropId,
        expected: expectedDropId,
        message: "Drop ID doesn't match current month. Use manual trigger to fix.",
      });
    } else {
      res.json({
        status: 'ok',
        dropId: config.currentDropId,
        message: 'Drop ID is correct for current month',
      });
    }
  } catch (error) {
    console.error('Error checking consistency:', error);
    res.status(500).json({ error: 'Failed to check consistency', details: error });
  }
});

/**
 * Helper function to notify users about new drop
 */
async function notifyUsersAboutNewDrop(dropId: string): Promise<void> {
  try {
    // Get all users with push tokens (implement based on your notification system)
    const db = admin.firestore();
    const usersRef = db
      .collection('users')
      .where('notificationsEnabled', '==', true)
      .where('isGoldVaultMember', '==', true);

    const usersSnap = await usersRef.get();

    if (usersSnap.empty) {
      console.log('No users to notify');
      return;
    }

    // Create notification payload
    const notification = {
      title: '🎁 New Monthly Drop Available!',
      body: 'Your exclusive Gold Vault rewards are ready to claim.',
      data: {
        type: 'monthly_drop',
        dropId: dropId,
        timestamp: Date.now().toString(),
      },
    };

    // In production, integrate with your push notification service
    // For now, just log
    console.log(`Would notify ${usersSnap.size} users about drop ${dropId}`);

    // Optional: Create notification records in Firestore
    const batch = db.batch();
    usersSnap.forEach((userDoc) => {
      const notifRef = db.collection('users').doc(userDoc.id).collection('notifications').doc();

      batch.set(notifRef, {
        ...notification,
        userId: userDoc.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
      });
    });

    await batch.commit();
    console.log('Notification records created');
  } catch (error) {
    console.error('Error notifying users:', error);
    // Don't throw - this is non-critical
  }
}
