#!/usr/bin/env node

/**
 * Simple script to create admin user using Firebase Client SDK
 * This is easier than using Admin SDK as it doesn't require service account setup
 * 
 * Usage: node create-admin-simple.js
 */

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');

// Firebase configuration (from your .env.local)
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
const auth = getAuth(app);

async function createAdminUser() {
  const email = 'admin@tiket.com';
  const password = 'Tiket2004';

  try {
    console.log('🔐 Creating admin user...');
    console.log('Email: admin@tiket.com');
    console.log('Password: Tiket2004');
    console.log('');

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log('✅ Admin user created successfully!');
    console.log('User ID:', user.uid);
    console.log('Email:', user.email);
    console.log('');
    console.log('📧 Login credentials:');
    console.log('Email: admin@tiket.com');
    console.log('Password: admin');
    console.log('');
    console.log('⚠️  IMPORTANT: Change this password after first login!');
    console.log('');
    console.log('✨ You can now login at your website with these credentials');
    
    process.exit(0);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('⚠️  User already exists!');
      console.log('Email: admin@tiket.com');
      console.log('Password: admin');
      console.log('');
      console.log('If you forgot the password, delete this user from Firebase Console and run this script again.');
      process.exit(0);
    } else if (error.code === 'auth/weak-password') {
      console.log('⚠️  Password is too weak. Using a simple password for testing...');
      console.log('Please update the password in the script or change it after login.');
      process.exit(1);
    } else {
      console.error('❌ Error creating admin user:');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      process.exit(1);
    }
  }
}

// Run the script
console.log('🚀 Firebase Admin User Creation Script');
console.log('=====================================');
console.log('');
createAdminUser();
