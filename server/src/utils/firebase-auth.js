const { admin, isFirebaseInitialized } = require('../config/firebase');
const { User } = require('../models');

/**
 * Verify Firebase ID token and get user
 * @param {string} idToken - Firebase ID token
 * @returns {Promise<Object>} - Firebase user data
 */
const verifyFirebaseToken = async (idToken) => {
  if (!isFirebaseInitialized()) {
    throw new Error('Firebase is not initialized');
  }
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    throw new Error(`Invalid Firebase token: ${error.message}`);
  }
};

/**
 * Find or create user from Firebase auth data
 * @param {Object} firebaseUser - Firebase user data
 * @returns {Promise<Object>} - User document
 */
const findOrCreateUserFromFirebase = async (firebaseUser) => {
  try {
    console.log('Firebase user data:', {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.name,
      display_name: firebaseUser.display_name,
      all_fields: Object.keys(firebaseUser)
    });

    // Check if user exists by Firebase UID
    let user = await User.findOne({ where: { firebaseUid: firebaseUser.uid } });

    if (!user) {
      // If not found by Firebase UID, check by email
      user = await User.findOne({ where: { email: firebaseUser.email } });

      if (user) {
        // If found by email, update Firebase UID
        user.firebaseUid = firebaseUser.uid;
        await user.save();
        console.log('Updated existing user with Firebase UID:', user.id);
      } else {
        // Create new user - try multiple name sources
        const userName = firebaseUser.name || 
                        firebaseUser.display_name || 
                        firebaseUser.email.split('@')[0];
                        
        console.log('Creating new user with name:', userName);
        
        user = await User.create({
          name: userName,
          email: firebaseUser.email,
          password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8),
          firebaseUid: firebaseUser.uid,
          avatar: firebaseUser.picture || null
        });
        
        console.log('Created new user:', {
          id: user.id,
          name: user.name,
          email: user.email
        });
      }
    } else {
      console.log('Found existing user:', {
        id: user.id,
        name: user.name,
        email: user.email
      });
    }

    return user;
  } catch (error) {
    console.error('Error in findOrCreateUserFromFirebase:', error);
    throw new Error(`Error finding or creating user: ${error.message}`);
  }
};

module.exports = {
  verifyFirebaseToken,
  findOrCreateUserFromFirebase
}; 