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

/**
 * Request interceptor
 * - Adds authentication token to requests if user is logged in
 * - Can be extended to add other headers or modify requests
 */
api.interceptors.request.use(
  async (config) => {
    // Get current user from Firebase Auth
    const user = auth.currentUser;
    
    if (user) {
      try {
        // Get the ID token
        const token = await user.getIdToken(true);
        
        // Add token to request headers
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error('Error getting auth token:', error);
      }
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
          // Could trigger logout or redirect to login
          console.error('Authentication error:', response.data);
          // You could dispatch an action to clear auth state or redirect
          // Example: window.location.href = '/login';
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
  // GET request
  get: (url, params = {}, config = {}) => {
    return api.get(url, { params, ...config });
  },
  
  // POST request
  post: (url, data = {}, config = {}) => {
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
  }
};

export default apiService; 