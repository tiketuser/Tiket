// Script to create admin user in Firebase Authentication
// Run this with: node create-admin-user.js

const admin = require('firebase-admin');
const serviceAccount = require('./creds.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function createAdminUser() {
  const email = 'admin@tiket.com';
  const password = 'admin';
  const displayName = 'Admin User';

  try {
    // Check if user already exists
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      console.log('✅ User already exists:', userRecord.uid);
      console.log('Email:', userRecord.email);
      console.log('Display Name:', userRecord.displayName);
      console.log('\n⚠️ User already exists. If you need to reset the password, delete the user first.');
      return;
    } catch (error) {
      // User doesn't exist, create new one
      if (error.code === 'auth/user-not-found') {
        console.log('Creating new admin user...');
        userRecord = await admin.auth().createUser({
          email: email,
          password: password,
          displayName: displayName,
          emailVerified: true, // Auto-verify admin email
        });
        console.log('✅ Admin user created successfully!');
        console.log('User ID:', userRecord.uid);
        console.log('Email:', userRecord.email);
        console.log('Display Name:', userRecord.displayName);
        console.log('\n📧 Login credentials:');
        console.log('Email: admin@tiket.com');
        console.log('Password: admin');
        console.log('\n⚠️ Please change this password after first login!');
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  } finally {
    // Exit the script
    process.exit(0);
  }
}

// Run the script
createAdminUser();
