/**
 * Firebase Admin SDK initialization for server-side operations
 * Used for authentication verification and admin operations
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK (singleton pattern)
if (!admin.apps.length) {
  try {
    // Initialize with Application Default Credentials for Cloud Run
    // This uses the service account attached to the Cloud Run service
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    // In development, we might not have credentials set up
    if (process.env.NODE_ENV === 'development') {
      console.warn('Running in development mode without Firebase Admin credentials');
    }
  }
}

export const adminAuth = admin.apps.length > 0 ? admin.auth() : null;
export const adminDb = admin.apps.length > 0 ? admin.firestore() : null;

export default admin;
