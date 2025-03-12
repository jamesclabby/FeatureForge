import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './MainLayout.css';

const MainLayout = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <div className="main-layout">
      <header className="main-header">
        <div className="header-container">
          <Link to="/" className="logo">
            FeatureForge
          </Link>
          <nav className="main-nav">
            {currentUser ? (
              <>
                <Link to="/dashboard" className="nav-link">
                  Dashboard
                </Link>
                <Link to="/features" className="nav-link">
                  Features
                </Link>
                <div className="user-menu">
                  <span className="user-name">
                    {currentUser.displayName || currentUser.email}
                  </span>
                  <button onClick={handleLogout} className="logout-button">
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <Link to="/login" className="nav-link">
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="main-content">{children}</main>
      <footer className="main-footer">
        <div className="footer-container">
          <p>&copy; {new Date().getFullYear()} FeatureForge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout; 