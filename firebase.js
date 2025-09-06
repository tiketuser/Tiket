// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  getFirestore,
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
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

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

let app, db, auth;

if (hasValidConfig) {
  // Initialize Firebase with real config
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth();
  setPersistence(auth, browserLocalPersistence);
} else {
  // Use mock implementations for development
  console.warn("Firebase not configured - using mock implementations for development");
  app = null;
  db = null;
  auth = null;
}

export {
  app,
  db,
  auth,
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