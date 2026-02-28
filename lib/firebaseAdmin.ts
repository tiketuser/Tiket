/**
 * Firebase Admin SDK initialization for server-side operations
 * Used for authentication verification and admin operations
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK (singleton pattern)
if (!admin.apps.length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    console.log('[FirebaseAdmin] Init check — projectId:', projectId || 'MISSING');
    console.log('[FirebaseAdmin] Init check — clientEmail:', clientEmail || 'MISSING');
    console.log('[FirebaseAdmin] Init check — privateKey present:', !!privateKey);

    if (privateKey && clientEmail && projectId) {
      console.log('[FirebaseAdmin] Using explicit service account credentials');
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      });
    } else {
      console.log('[FirebaseAdmin] Falling back to Application Default Credentials (ADC)');
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }
    console.log('[FirebaseAdmin] Initialized successfully');
  } catch (error) {
    console.error('[FirebaseAdmin] Initialization error:', error);
  }
}

export const adminAuth = admin.apps.length > 0 ? admin.auth() : null;
export const adminDb = admin.apps.length > 0 ? admin.firestore() : null;

export default admin;
