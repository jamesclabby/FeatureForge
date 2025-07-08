import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const SignUp = ({ onLoginClick }) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signup, loginWithGoogle, currentUser } = useAuth();
  const navigate = useNavigate();

  // Navigate to team selector when user is authenticated after signup
  useEffect(() => {
    if (currentUser && !loading) {
      console.log('SignUp: User authenticated after signup, navigating to team selector');
      // Mark this as a new user signup for onboarding
      localStorage.setItem('isNewUserSignup', 'true');
      navigate('/selector', { replace: true });
    }
  }, [currentUser, loading, navigate]);

  const validateForm = () => {
    if (!displayName.trim()) {
      setError('Name is required');
      return false;
    }
    
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    
    if (!password) {
      setError('Password is required');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    // Password strength validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setError('');
      setLoading(true);
      console.log('SignUp: Starting signup process for:', email);
      await signup(email, password, displayName);
      console.log('SignUp: Signup successful, waiting for auth state change...');
      // Navigation will be handled by useEffect when currentUser updates
    } catch (err) {
      console.error('SignUp: Signup failed:', err);
      setError('Failed to create an account: ' + (err.message || 'Please try again'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      console.log('SignUp: Starting Google signup process');
      await loginWithGoogle();
      console.log('SignUp: Google signup successful, waiting for auth state change...');
      // Mark as new user signup for Google users too
      localStorage.setItem('isNewUserSignup', 'true');
      // Navigation will be handled by useEffect when currentUser updates
    } catch (err) {
      console.error('SignUp: Google signup failed:', err);
      setError('Failed to sign in with Google: ' + (err.message || 'Please try again'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-secondary-900">Create an Account</h2>
        <p className="text-secondary-500 mt-2">Join FeatureForge to manage your product features</p>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Full Name</Label>
          <Input
            type="text"
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your name"
            disabled={loading}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            disabled={loading}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            disabled={loading}
            required
          />
          <p className="text-xs text-secondary-500">Password must be at least 6 characters long</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            disabled={loading}
            required
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </Button>
      </form>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-secondary-200"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-secondary-500">Or continue with</span>
        </div>
      </div>
      
      <Button 
        type="button"
        onClick={handleGoogleSignIn} 
        variant="outline"
        className="w-full"
        disabled={loading}
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
          <path d="M1 1h22v22H1z" fill="none" />
        </svg>
        Sign up with Google
      </Button>
      
      <div className="text-center text-sm">
        <span className="text-secondary-500">Already have an account?</span>{' '}
        {onLoginClick ? (
          <button 
            type="button"
            onClick={onLoginClick} 
            className="text-primary-600 hover:text-primary-800 font-medium"
          >
            Log in
          </button>
        ) : (
          <Link 
            to="/login"
            className="text-primary-600 hover:text-primary-800 font-medium"
          >
            Log in
          </Link>
        )}
      </div>
    </div>
  );
};

export default SignUp; 