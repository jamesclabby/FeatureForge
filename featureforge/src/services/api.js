import axios from 'axios';
import { auth } from './firebase';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Extracted auth utility functions to avoid circular dependencies
export const authUtils = {
  // Check authentication state
  checkAuthState: async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const token = await user.getIdToken(true);
        console.log("Current user authenticated:", user.email);
        console.log("Token available (first 20 chars):", token.substring(0, 20) + "...");
        return true;
      } catch (error) {
        console.error("Failed to get token:", error);
        return false;
      }
    } else {
      console.warn("No current user found");
      return false;
    }
  },
  
  // Get current user
  getCurrentUser: () => auth.currentUser,
  
  // Get token for current user
  getIdToken: async (forceRefresh = false) => {
    const user = auth.currentUser;
    if (user) {
      return user.getIdToken(forceRefresh);
    }
    return null;
  }
};

// For backward compatibility
export const checkAuthState = authUtils.checkAuthState;

/**
 * Request interceptor
 * - Adds authentication token to requests if user is logged in
 * - Can be extended to add other headers or modify requests
 */
api.interceptors.request.use(
  async (config) => {
    try {
      // Get current user from Firebase Auth using authUtils
      const user = authUtils.getCurrentUser();
      
      if (user) {
        try {
          // Force refresh the token
          const token = await authUtils.getIdToken(true);
          
          if (token) {
            // Add token to request headers
            config.headers.Authorization = `Bearer ${token}`;
            console.log(`Request to ${config.url} with auth token`);
          } else {
            console.warn(`Request to ${config.url} - token is null even though user is logged in`);
          }
        } catch (error) {
          console.error('Error getting auth token:', error);
          // Continue with request without token
        }
      } else {
        console.warn(`Request to ${config.url} without authentication`);
      }
    } catch (error) {
      console.error('Error in request interceptor:', error);
      // Continue with request without token
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * - Handles common error responses
 * - Can be extended to transform response data
 */
api.interceptors.response.use(
  (response) => {
    // Return successful responses directly
    return response.data;
  },
  (error) => {
    // Handle errors
    const { response } = error;
    
    // Handle specific HTTP status codes
    if (response) {
      switch (response.status) {
        case 401: // Unauthorized
          console.error('Authentication error (401):', response.data);
          console.log('Request URL:', error.config?.url);
          console.log('Request Method:', error.config?.method);
          console.log('Authorization header present:', !!error.config?.headers?.Authorization);
          if (error.config?.headers?.Authorization) {
            const token = error.config.headers.Authorization.split(' ')[1];
            console.log('Token length:', token ? token.length : 'No token');
            console.log('Token first 20 chars:', token ? token.substring(0, 20) + '...' : 'No token');
          }
          console.log('Current auth state:');
          authUtils.checkAuthState().then(isAuth => {
            if (!isAuth) {
              console.log('User is not authenticated, consider redirecting to login');
              // window.location.href = '/login';
            } else {
              console.log('User is authenticated in Firebase, but token was rejected by server');
              console.log('This might be a token format issue or server-side authentication problem');
            }
          });
          break;
          
        case 403: // Forbidden
          console.error('Permission denied:', response.data);
          break;
          
        case 404: // Not Found
          console.error('Resource not found:', response.data);
          break;
          
        case 500: // Server Error
          console.error('Server error:', response.data);
          break;
          
        default:
          console.error('API error:', response.data);
      }
      
      // Return a more user-friendly error object
      return Promise.reject({
        status: response.status,
        message: response.data.message || 'An error occurred',
        data: response.data
      });
    }
    
    // Handle network errors or other issues
    return Promise.reject({
      message: error.message || 'Network error',
      error
    });
  }
);

/**
 * API service methods
 * These methods wrap the axios instance to provide a cleaner interface
 */
const apiService = {
  // Check auth state (exported function)
  checkAuth: authUtils.checkAuthState,
  
  // Debug utility for the frontend
  debugAuth: async () => {
    try {
      console.group("🔍 Authentication Debug Information");
      console.log("API Base URL:", process.env.REACT_APP_API_URL || 'http://localhost:5000/api');
      
      // Check if user is logged in
      const user = authUtils.getCurrentUser();
      console.log("User logged in:", !!user);
      
      if (user) {
        console.log("User email:", user.email);
        console.log("User display name:", user.displayName);
        console.log("User UID:", user.uid);
        
        // Try to get the ID token
        const token = await authUtils.getIdToken(true);
        console.log("Token available:", !!token);
        if (token) {
          console.log("Token length:", token.length);
          console.log("Token first 20 chars:", token.substring(0, 20) + "...");
        }
        
        // Try making a request to the /auth/me endpoint
        try {
          console.log("Testing /auth/me/firebase endpoint...");
          const response = await api.get('/auth/me/firebase');
          console.log("Successfully authenticated with backend:", response);
          return { success: true, user: response };
        } catch (error) {
          console.error("Failed to authenticate with backend:", error.message);
          if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
          }
          return { success: false, error };
        }
      } else {
        console.log("No user is currently logged in");
        return { success: false, error: "No user logged in" };
      }
    } catch (error) {
      console.error("Auth debug error:", error);
      return { success: false, error };
    } finally {
      console.groupEnd();
    }
  },
  
  // GET request
  get: (url, params = {}, config = {}) => {
    return api.get(url, { params, ...config });
  },
  
  // POST request
  post: (url, data = {}, config = {}) => {
    console.log(`Making POST request to: ${url}`);
    return api.post(url, data, config);
  },
  
  // PUT request
  put: (url, data = {}, config = {}) => {
    return api.put(url, data, config);
  },
  
  // PATCH request
  patch: (url, data = {}, config = {}) => {
    return api.patch(url, data, config);
  },
  
  // DELETE request
  delete: (url, config = {}) => {
    return api.delete(url, config);
  },
};

export default apiService; 