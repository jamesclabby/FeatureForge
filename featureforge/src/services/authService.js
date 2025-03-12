// Authentication service using Firebase
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  googleProvider,
  signInWithPopup
} from './firebase';

/**
 * Sign in with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise} - Firebase auth promise
 */
export const loginWithEmailAndPassword = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

/**
 * Sign up with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise} - Firebase auth promise
 */
export const registerWithEmailAndPassword = (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

/**
 * Sign in with Google
 * @returns {Promise} - Firebase auth promise
 */
export const signInWithGoogle = () => {
  return signInWithPopup(auth, googleProvider);
};

/**
 * Sign out the current user
 * @returns {Promise} - Firebase auth promise
 */
export const logoutUser = () => {
  return signOut(auth);
};

/**
 * Subscribe to auth state changes
 * @param {Function} callback - Function to call when auth state changes
 * @returns {Function} - Unsubscribe function
 */
export const subscribeToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Get the current user
 * @returns {Object|null} - Current user or null if not authenticated
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

export default {
  loginWithEmailAndPassword,
  registerWithEmailAndPassword,
  signInWithGoogle,
  logoutUser,
  subscribeToAuthChanges,
  getCurrentUser
}; 