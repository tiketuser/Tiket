/**
 * Firebase Admin SDK initialization for server-side operations
 * This is separate from the client-side firebase.ts
 */

import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let adminApp: App | null = null;
let adminAuth: Auth | null = null;
let adminDb: Firestore | null = null;

/**
 * Initialize Firebase Admin SDK
 * Uses service account credentials from environment variables
 */
export function initializeAdminApp() {
  if (adminApp) {
    return { app: adminApp, auth: adminAuth, db: adminDb };
  }

  try {
    // Check if already initialized
    const apps = getApps();
    if (apps.length > 0) {
      adminApp = apps[0];
      adminAuth = getAuth(adminApp);
      adminDb = getFirestore(adminApp);
      return { app: adminApp, auth: adminAuth, db: adminDb };
    }

    // Initialize with service account credentials from environment
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!privateKey || !clientEmail || !projectId) {
      console.warn(
        "Firebase Admin credentials not configured - some server features will be unavailable"
      );
      return { app: null, auth: null, db: null };
    }

    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);

    return { app: adminApp, auth: adminAuth, db: adminDb };
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error);
    return { app: null, auth: null, db: null };
  }
}

/**
 * Get Firebase Admin Auth instance
 */
export function getAdminAuth(): Auth | null {
  if (!adminAuth) {
    const { auth } = initializeAdminApp();
    return auth;
  }
  return adminAuth;
}

/**
 * Get Firebase Admin Firestore instance
 */
export function getAdminDb(): Firestore | null {
  if (!adminDb) {
    const { db } = initializeAdminApp();
    return db;
  }
  return adminDb;
}

/**
 * Verify Firebase ID token and check if user is admin
 */
export async function verifyAdminToken(
  idToken: string
): Promise<{ isValid: boolean; isAdmin: boolean; uid?: string; email?: string }> {
  try {
    const auth = getAdminAuth();
    if (!auth) {
      return { isValid: false, isAdmin: false };
    }

    // Verify the ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    // Check if user is admin (hardcoded list for now)
    const ADMIN_EMAILS = ["tiketbizzz@gmail.com", "admin@tiket.com"];
    const isAdmin = email ? ADMIN_EMAILS.includes(email) : false;

    return {
      isValid: true,
      isAdmin,
      uid,
      email,
    };
  } catch (error) {
    console.error("Error verifying token:", error);
    return { isValid: false, isAdmin: false };
  }
}
