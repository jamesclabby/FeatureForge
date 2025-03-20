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

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component that wraps the app and makes auth object available to any child component that calls useAuth()
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [backendUser, setBackendUser] = useState(null);

  // Register user with backend
  const registerWithBackend = async (firebaseUser) => {
    try {
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
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
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 