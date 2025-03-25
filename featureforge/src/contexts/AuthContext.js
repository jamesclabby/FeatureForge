import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile
} from '../services/firebase';
import apiService from '../services/api';

// Create the authentication context
const AuthContext = createContext();

// Provider component that wraps the app and makes auth object available to any child component that calls useAuth()
const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [backendUser, setBackendUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lastAuthCheck, setLastAuthCheck] = useState(0);

  // Register user with backend
  const registerWithBackend = async (firebaseUser) => {
    try {
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken(true); // Force token refresh
        const response = await apiService.post('/auth/firebase', { idToken });
        console.log('Backend user registered:', response);
        setBackendUser(response.data);
        return response;
      }
    } catch (err) {
      console.error('Error registering with backend:', err);
      // We don't throw here to prevent blocking the auth flow
    }
  };

  // Refresh the user's token
  const refreshToken = async () => {
    try {
      if (currentUser) {
        console.log('Refreshing auth token...');
        const token = await currentUser.getIdToken(true);
        console.log('Token refreshed successfully');
        return token;
      }
      return null;
    } catch (err) {
      console.error('Error refreshing token:', err);
      setError('Failed to refresh authentication token. Please try logging in again.');
      throw err;
    }
  };

  // Verify the user's authentication status with the backend
  const verifyAuth = async () => {
    try {
      // Check if we have a cached authentication result less than 30 seconds old
      const now = Date.now();
      if (isAuthenticated && (now - lastAuthCheck < 30000)) {
        console.log('Using cached authentication status - already verified');
        return true;
      }

      if (!currentUser) {
        console.warn('No current user to verify');
        setIsAuthenticated(false);
        setLastAuthCheck(now);
        return false;
      }
      
      // Force refresh token first
      await refreshToken();
      
      // Test with backend to make sure token is valid - use Firebase auth endpoint
      console.log('Verifying auth with /auth/me/firebase endpoint...');
      const response = await apiService.get('/auth/me/firebase');
      console.log('Auth verification successful:', response);
      
      // Update backend user data
      setBackendUser(response.user || response);
      setIsAuthenticated(true);
      setLastAuthCheck(now);
      return true;
    } catch (err) {
      console.error('Auth verification failed:', err);
      
      // Check for specific error message from the server indicating Firebase is not initialized
      if (err.status === 503 || (err.data && err.data.message && err.data.message.includes('Firebase authentication is not available'))) {
        console.warn('Firebase authentication is not available on the server. Some features may be limited.');
        // We'll consider this a partial success since the user is authenticated with Firebase,
        // even if the server doesn't have Firebase configured
        setIsAuthenticated(true);
        setLastAuthCheck(Date.now());
        return true;
      }
      
      setIsAuthenticated(false);
      setLastAuthCheck(Date.now());
      return false;
    }
  };

  // Sign up with email and password
  const signup = async (email, password, displayName) => {
    try {
      setError('');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's profile with display name if provided
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
      
      // Register with backend
      await registerWithBackend(userCredential.user);
      
      return userCredential.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Login with email and password
  const login = async (email, password) => {
    try {
      setError('');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Register with backend
      await registerWithBackend(userCredential.user);
      
      return userCredential.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Login with Google
  const loginWithGoogle = async () => {
    try {
      setError('');
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      // Register with backend
      await registerWithBackend(userCredential.user);
      
      return userCredential.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Logout
  const logout = async () => {
    try {
      setError('');
      await signOut(auth);
      setBackendUser(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      setError('');
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Update user profile
  const updateUserProfile = async (profile) => {
    try {
      setError('');
      if (currentUser) {
        await updateProfile(currentUser, profile);
        // Force refresh the user to get the updated profile
        setCurrentUser({ ...currentUser });
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Subscribe to auth state changes when the component mounts
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      // Register with backend when user changes (e.g., on page refresh)
      if (user) {
        try {
          await registerWithBackend(user);
        } catch (error) {
          console.error("Error syncing with backend:", error);
        }
      } else {
        setBackendUser(null);
      }
      
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  // Context value to be provided
  const value = {
    currentUser,
    backendUser,
    loading,
    error,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
    refreshToken,
    verifyAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
const useAuth = () => {
  return useContext(AuthContext);
};

// Export after definitions are complete
export { AuthProvider, useAuth };
export default AuthContext; 