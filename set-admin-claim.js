/**
 * Script to set admin custom claims for a user
 * Run with: node set-admin-claim.js <email>
 * Example: node set-admin-claim.js admin@tiket.com
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    // Try to use service account credentials if available
    const serviceAccount = require('./creds.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.log('Service account not found, using application default credentials');
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
  }
}

async function setAdminClaim() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: node set-admin-claim.js <email>');
    console.log('Example: node set-admin-claim.js admin@tiket.com');
    process.exit(1);
  }

  try {
    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    
    console.log(`\n👤 Found user: ${userRecord.email}`);
    console.log(`   UID: ${userRecord.uid}`);
    
    // Set custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      admin: true
    });

    console.log(`\n✅ Admin privileges granted to ${email}`);
    console.log('⚠️  User must sign out and sign back in for changes to take effect\n');

  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`❌ User not found: ${email}`);
      console.log('   Please create the user first using create-admin-user.js');
    } else {
      console.error('❌ Error setting admin claim:', error.message);
    }
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the script
setAdminClaim();
