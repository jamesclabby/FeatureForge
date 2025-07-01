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
      const hasServiceAccountFile = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      const hasIndividualVars = process.env.FIREBASE_PROJECT_ID && 
                                process.env.FIREBASE_CLIENT_EMAIL && 
                                process.env.FIREBASE_PRIVATE_KEY;
      
      if (!hasServiceAccountFile && !hasIndividualVars) {
        const message = 'Firebase configuration missing. Need either FIREBASE_SERVICE_ACCOUNT_KEY or (FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY)';
        if (required) {
          throw new Error(message);
        } else {
          console.warn(message);
          return null;
        }
      }
      
      // Option 1: Use service account file path (for local development)
      if (hasServiceAccountFile) {
        try {
          const serviceAccount = require(path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_KEY));
          
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET
          });
          console.log('Firebase Admin SDK initialized with service account file');
        } catch (error) {
          const message = `Error loading Firebase service account file: ${error.message}`;
          if (required) {
            throw new Error(message);
          } else {
            console.warn(message);
            return null;
          }
        }
      } 
      // Option 2: Use individual environment variables (for production/Vercel)
      else if (hasIndividualVars) {
        try {
          // Replace \n characters in private key (common issue with env vars)
          const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
          
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId: process.env.FIREBASE_PROJECT_ID,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: privateKey,
            }),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET
          });
          console.log('Firebase Admin SDK initialized with environment variables');
        } catch (error) {
          const message = `Error initializing Firebase with environment variables: ${error.message}`;
          if (required) {
            throw new Error(message);
          } else {
            console.warn(message);
            return null;
          }
        }
      } else {
        // Fallback: try application default credentials
        try {
          admin.initializeApp({
            projectId: process.env.FIREBASE_PROJECT_ID,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET
          });
          console.log('Firebase Admin SDK initialized with application default credentials');
        } catch (error) {
          const message = `Error with application default credentials: ${error.message}`;
          if (required) {
            throw new Error(message);
          } else {
            console.warn(message);
            return null;
          }
        }
      }
      
      isInitialized = true;
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