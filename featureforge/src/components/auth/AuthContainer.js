import React, { useState } from 'react';
import { Login, SignUp, ResetPassword } from './index';
import './Auth.css';

// Enum for auth views
const AuthView = {
  LOGIN: 'login',
  SIGNUP: 'signup',
  RESET_PASSWORD: 'reset_password'
};

const AuthContainer = () => {
  const [currentView, setCurrentView] = useState(AuthView.LOGIN);

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
    <div className="auth-container">
      {renderAuthComponent()}
    </div>
  );
};

export default AuthContainer; 