import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTeamContext } from '../../hooks/useTeamContext';
import { Button } from '../ui/button';
import { AIChatWidget } from '../chat';
import { Menu, X } from 'lucide-react';
import { cn } from '../../lib/utils';

const MainLayout = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const { teamId, teamName, userRole, isTeamSelected } = useTeamContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setMobileMenuOpen(false);
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

  // Check if a route is currently active
  const isActive = (path) => {
    if (path === '/selector') {
      return location.pathname === '/selector';
    }
    return location.pathname.startsWith(path);
  };

  // Navigation link component with active state
  const NavLink = ({ to, children, onClick }) => (
    <Link 
      to={to} 
      onClick={onClick}
      className={cn(
        "transition-colors",
        isActive(to) 
          ? "text-accent font-medium" 
          : "text-foreground-secondary hover:text-accent"
      )}
    >
      {children}
    </Link>
  );

  // Mobile navigation link
  const MobileNavLink = ({ to, children }) => (
    <Link 
      to={to} 
      onClick={() => setMobileMenuOpen(false)}
      className={cn(
        "block px-4 py-3 transition-colors border-b border-border-muted",
        isActive(to) 
          ? "text-accent font-medium bg-accent-50" 
          : "text-foreground-secondary hover:text-accent hover:bg-background-elevated"
      )}
    >
      {children}
    </Link>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background-base">
      <header className="bg-background-surface border-b border-border py-4 shadow-sm relative">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-semibold text-foreground">
            FeatureForge
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {currentUser ? (
              <>
                <NavLink to="/selector">Switch Team</NavLink>
                {selectedTeamId && (
                  <NavLink to={`/team-dashboard/${selectedTeamId}`}>Dashboard</NavLink>
                )}
                <NavLink to="/features">Features</NavLink>
                <NavLink to="/board">Board</NavLink>
                <div className="flex items-center gap-4 ml-4 pl-4 border-l border-border">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-foreground">
                      {currentUser.displayName || currentUser.email}
                    </span>
                    <span className="text-xs text-foreground-muted">
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

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-foreground-secondary hover:text-accent transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-background-surface border-b border-border shadow-lg z-50">
            {currentUser ? (
              <>
                {/* User info */}
                <div className="px-4 py-3 bg-background-elevated border-b border-border">
                  <p className="text-sm font-medium text-foreground">
                    {currentUser.displayName || currentUser.email}
                  </p>
                  {currentUser.displayName && (
                    <p className="text-xs text-foreground-muted">{currentUser.email}</p>
                  )}
                </div>
                
                {/* Navigation links */}
                <MobileNavLink to="/selector">Switch Team</MobileNavLink>
                {selectedTeamId && (
                  <MobileNavLink to={`/team-dashboard/${selectedTeamId}`}>Dashboard</MobileNavLink>
                )}
                <MobileNavLink to="/features">Features</MobileNavLink>
                <MobileNavLink to="/board">Board</MobileNavLink>
                
                {/* Logout button */}
                <div className="p-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <div className="p-4 space-y-3">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">Login</Button>
                </Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      
      <footer className="bg-background-surface border-t border-border py-6">
        <div className="container mx-auto px-4 text-center text-foreground-muted text-sm">
          <p>&copy; {new Date().getFullYear()} FeatureForge. All rights reserved.</p>
          <p className="mt-2">A modern feature management platform for product teams.</p>
        </div>
      </footer>

      {/* AI Chat Widget - Only show when user is logged in and has a team selected */}
      {currentUser && isTeamSelected && (
        <AIChatWidget
          teamId={teamId}
          teamName={teamName}
          userRole={userRole}
        />
      )}
    </div>
  );
};

export default MainLayout;
