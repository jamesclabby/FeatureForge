import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const ResetPassword = ({ onLoginClick }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      return setError('Please enter your email');
    }
    
    try {
      setMessage('');
      setError('');
      setLoading(true);
      await resetPassword(email);
      setMessage('Check your email for further instructions');
    } catch (err) {
      setError('Failed to reset password: ' + (err.message || 'Please try again'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-secondary-900">Reset Password</h2>
        <p className="text-secondary-500 mt-2">We'll send you a link to reset your password</p>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {message && (
        <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
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
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Reset Password'}
        </Button>
      </form>
      
      <div className="text-center text-sm">
        <button 
          type="button"
          onClick={onLoginClick} 
          className="text-primary-600 hover:text-primary-800 font-medium"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default ResetPassword; 