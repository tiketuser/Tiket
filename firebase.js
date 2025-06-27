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
  apiKey: "AIzaSyCGiiy5smPnTFY7RdhsHfe12briESgTr4k",
  authDomain: "tiket-9268c.firebaseapp.com",
  projectId: "tiket-9268c",
  storageBucket: "tiket-9268c.firebasestorage.app",
  messagingSenderId: "653453593991",
  appId: "1:653453593991:web:67009ebea86a870f735722"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);
const auth = getAuth();
setPersistence(auth, browserLocalPersistence);

export {
  app,
  db,
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