const admin = require('firebase-admin');
const path = require('path');

// Variable to track if Firebase is initialized
let isInitialized = false;

/**
 * Initialize Firebase Admin SDK
 * @param {boolean} required - Whether Firebase initialization is required
 * @returns {Object|null} - Firebase admin instance or null if initialization fails
 */
const initializeFirebaseAdmin = async (required = false) => {
  try {
    // Check if Firebase Admin is already initialized
    if (admin.apps.length === 0) {
      // Check if required environment variables are present
      const hasServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      const hasProjectId = process.env.FIREBASE_PROJECT_ID;
      
      if (!hasServiceAccount && !hasProjectId) {
        const message = 'Firebase configuration missing. Check your environment variables.';
        if (required) {
          throw new Error(message);
        } else {
          console.warn(message);
          return null;
        }
      }
      
      // If service account key path is provided, use it
      if (hasServiceAccount) {
        try {
          const serviceAccount = require(path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_KEY));
          
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET
          });
        } catch (error) {
          const message = `Error loading Firebase service account: ${error.message}`;
          if (required) {
            throw new Error(message);
          } else {
            console.warn(message);
            return null;
          }
        }
      } else {
        // Otherwise, use application default credentials
        admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID,
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET
        });
      }
      
      isInitialized = true;
      console.log('Firebase Admin SDK initialized');
    }
    
    return admin;
  } catch (error) {
    const message = `Error initializing Firebase Admin SDK: ${error.message}`;
    if (required) {
      throw new Error(message);
    } else {
      console.warn(message);
      return null;
    }
  }
};

/**
 * Check if Firebase is initialized
 * @returns {boolean} - Whether Firebase is initialized
 */
const isFirebaseInitialized = () => {
  return isInitialized && admin.apps.length > 0;
};

module.exports = {
  admin,
  initializeFirebaseAdmin,
  isFirebaseInitialized
}; 