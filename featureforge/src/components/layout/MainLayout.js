import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';

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

  // Helper function to get the currently selected team ID
  const getSelectedTeamId = () => {
    try {
      return localStorage.getItem('selectedTeamId');
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return null;
    }
  };

  const selectedTeamId = getSelectedTeamId();

  return (
    <div className="flex flex-col min-h-screen bg-secondary-50">
      <header className="bg-white border-b border-secondary-200 py-4 shadow-sm">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-primary-600">
            FeatureForge
          </Link>
          
          <nav className="flex items-center gap-6">
            {currentUser ? (
              <>
                <Link to="/selector" className="text-secondary-700 hover:text-primary-600 transition-colors">
                  Switch Team
                </Link>
                {selectedTeamId && (
                  <Link to={`/team-dashboard/${selectedTeamId}`} className="text-secondary-700 hover:text-primary-600 transition-colors">
                    Dashboard
                  </Link>
                )}
                <Link to="/features" className="text-secondary-700 hover:text-primary-600 transition-colors">
                  Features
                </Link>
                <div className="flex items-center gap-4 ml-4 pl-4 border-l border-secondary-200">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-secondary-900">
                      {currentUser.displayName || currentUser.email}
                    </span>
                    <span className="text-xs text-secondary-500">
                      {currentUser.displayName ? currentUser.email : ''}
                    </span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLogout}
                    className="ml-2"
                  >
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex gap-3">
                <Link to="/login">
                  <Button variant="outline">Login</Button>
                </Link>
                <Link to="/signup">
                  <Button>Sign Up</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      
      <footer className="bg-white border-t border-secondary-200 py-6">
        <div className="container mx-auto px-4 text-center text-secondary-500 text-sm">
          <p>&copy; {new Date().getFullYear()} FeatureForge. All rights reserved.</p>
          <p className="mt-2">A modern feature management platform for product teams.</p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout; 