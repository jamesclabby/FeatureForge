require('dotenv').config();
const { admin, initializeFirebaseAdmin } = require('../config/firebase');

async function generateCustomToken() {
  try {
    // Initialize Firebase Admin SDK
    await initializeFirebaseAdmin(true);
    
    const uid = '3yqQJgXaJ2TREUn3HtHuuUVCTlp2';
    const customToken = await admin.auth().createCustomToken(uid);
    console.log('Custom Token:', customToken);
  } catch (error) {
    console.error('Error generating custom token:', error);
  }
}

generateCustomToken(); 