import React, { useState } from 'react';
import Login from './Login';
import SignUp from './SignUp';
import ResetPassword from './ResetPassword';
import { Card } from '../ui/card';

// Enum for auth views
const AuthView = {
  LOGIN: 'login',
  SIGNUP: 'signup',
  RESET_PASSWORD: 'reset_password'
};

const AuthContainer = ({ initialTab }) => {
  // Use initialTab if provided, otherwise default to login
  const initialView = initialTab === 'register' ? AuthView.SIGNUP : AuthView.LOGIN;
  const [currentView, setCurrentView] = useState(initialView);

  const switchToLogin = () => {
    setCurrentView(AuthView.LOGIN);
  };

  const switchToSignUp = () => {
    setCurrentView(AuthView.SIGNUP);
  };

  const switchToResetPassword = () => {
    setCurrentView(AuthView.RESET_PASSWORD);
  };

  // Render the appropriate component based on the current view
  const renderAuthComponent = () => {
    switch (currentView) {
      case AuthView.SIGNUP:
        return <SignUp onLoginClick={switchToLogin} />;
      case AuthView.RESET_PASSWORD:
        return <ResetPassword onLoginClick={switchToLogin} />;
      case AuthView.LOGIN:
      default:
        return (
          <Login
            onSignUpClick={switchToSignUp}
            onResetPasswordClick={switchToResetPassword}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 px-4 py-12">
      <Card className="w-full max-w-md p-8 shadow-lg">
        {renderAuthComponent()}
      </Card>
    </div>
  );
};

export default AuthContainer; 