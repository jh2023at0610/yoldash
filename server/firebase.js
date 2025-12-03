const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    console.log('Firebase env check:', {
      hasKey: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      hasPath: !!process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
      pathValue: process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    });
    
    // Option 1: Use service account key file (recommended for production)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✓ Firebase initialized with service account key from env');
    }
    // Option 2: Use service account file path
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      let serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
      // Remove leading ./ if present
      if (serviceAccountPath.startsWith('./')) {
        serviceAccountPath = serviceAccountPath.substring(2);
      }
      // Resolve relative to server directory
      serviceAccountPath = path.resolve(__dirname, serviceAccountPath);
      console.log('Resolved service account path:', serviceAccountPath);
      
      if (!require('fs').existsSync(serviceAccountPath)) {
        throw new Error(`Firebase service account file not found: ${serviceAccountPath}`);
      }
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✓ Firebase initialized with service account file:', serviceAccountPath);
    }
    // Option 3: Use default credentials (for Firebase emulator or GCP)
    else {
      admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
      console.log('✓ Firebase initialized with default credentials');
    }
  } catch (error) {
    console.error('✗ Firebase initialization failed:', error.message);
    throw error;
  }
}

const db = admin.firestore();

module.exports = { admin, db };

