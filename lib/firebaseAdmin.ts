/**
 * Firebase Admin SDK initialization for server-side operations
 * Used for authentication verification and admin operations
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK (singleton pattern)
// Uses Application Default Credentials (ADC) — works automatically on Cloud Run
// via the attached service account (firebase-adminsdk-fbsvc@tiket-9268c.iam.gserviceaccount.com)
if (!admin.apps.length) {
  try {
    console.log('[FirebaseAdmin] Initializing with ADC...');
    admin.initializeApp();
    console.log('[FirebaseAdmin] Initialized successfully');
  } catch (error) {
    console.error('[FirebaseAdmin] Initialization error:', error);
  }
}

export const adminAuth = admin.apps.length > 0 ? admin.auth() : null;
export const adminDb = admin.apps.length > 0 ? admin.firestore() : null;

export default admin;
