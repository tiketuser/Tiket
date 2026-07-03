/**
 * Firebase Admin SDK initialization for server-side operations
 * This is separate from the client-side firebase.ts
 */

import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth, DecodedIdToken } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

/**
 * Decide whether a verified ID token belongs to an admin.
 *
 * Primary (unforgeable): the `admin` custom claim, set server-side only via
 * `set-admin-claim.js` / `POST /api/admin/users`. Fallback: an allow-listed
 * email that Firebase has confirmed the user actually owns (`email_verified`).
 * The email fallback intentionally has NO hardcoded default — a missing
 * `ADMIN_EMAILS` env var fails closed, and email/password sign-up alone can
 * never satisfy it because unverified emails are rejected.
 */
export function isAdminFromToken(decodedToken: DecodedIdToken): boolean {
  if (decodedToken.admin === true) return true;

  const email = decodedToken.email;
  if (!email || decodedToken.email_verified !== true) return false;

  const allowList = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return allowList.includes(email.toLowerCase());
}

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
      const missing = [];
      if (!privateKey) missing.push("FIREBASE_PRIVATE_KEY");
      if (!clientEmail) missing.push("FIREBASE_CLIENT_EMAIL");
      if (!projectId) missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
      console.warn(
        `Firebase Admin credentials not configured. Missing: ${missing.join(", ")}. Some server features will be unavailable.`
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

    const isAdmin = isAdminFromToken(decodedToken);

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
