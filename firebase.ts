// Import the functions you need from the SDKs you need
import { initializeApp, FirebaseApp } from "firebase/app";
import {
  initializeFirestore,
  Firestore,
  collection,
  getDocs,
  setDoc,
  doc,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from "firebase/firestore";
import {
  initializeAuth,
  Auth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  inMemoryPersistence,
} from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abc123def456",
};

// Check if we have real Firebase config
const hasValidConfig = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
                      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

let app: FirebaseApp | null;
let db: Firestore | null;
let auth: Auth | null;
let storage: FirebaseStorage | null;

if (hasValidConfig) {
  app = initializeApp(firebaseConfig);
  db = initializeFirestore(app, { experimentalForceLongPolling: true });
  auth = initializeAuth(app, {
    persistence: [
      indexedDBLocalPersistence,
      browserLocalPersistence,
      inMemoryPersistence,
    ],
    // NOTE: popupRedirectResolver is NOT wired here — passing it via
    // initializeAuth fails SSR ("Expected a class definition") because the
    // resolver expects a browser env. Instead, signInWithPopup receives it
    // explicitly in lib/platform-auth.ts, which only runs client-side.
  });
  storage = getStorage(app);
} else {
  // Use mock implementations for development
  console.warn("Firebase not configured - using mock implementations for development");
  app = null;
  db = null;
  auth = null;
  storage = null;
}

export {
  app,
  db,
  auth,
  storage,
  hasValidConfig,
  collection,
  getDocs,
  setDoc,
  doc,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
};