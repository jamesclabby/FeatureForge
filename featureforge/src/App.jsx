import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastContextProvider } from './components/ui/toast';
import { useAuth } from './contexts/AuthContext';
import MainLayout from './components/layout/MainLayout';
import AuthContainer from './components/auth/AuthContainer';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import TeamList from './components/teams/TeamList';
import TeamDetails from './components/teams/TeamDetails';
import TeamSelector from './components/teams/TeamSelector';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

// Protected route component that checks for authentication
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Team route component that checks for team selection
const TeamRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const [hasSelectedTeam, setHasSelectedTeam] = useState(false);
  const [checkingTeam, setCheckingTeam] = useState(true);
  
  useEffect(() => {
    if (isAuthenticated) {
      // Check if user has a selected team
      const selectedTeamId = localStorage.getItem('selectedTeamId');
      setHasSelectedTeam(!!selectedTeamId);
      setCheckingTeam(false);
    }
  }, [isAuthenticated]);
  
  if (loading || checkingTeam) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (!hasSelectedTeam) {
    return <TeamSelector />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastContextProvider>
          <div id="toast-container" /> {/* Container for direct toast calls */}
          <MainLayout>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes that require team selection */}
              <Route path="/dashboard" element={
                <TeamRoute>
                  <Dashboard />
                </TeamRoute>
              } />
              
              {/* Team management routes */}
              <Route path="/teams" element={
                <ProtectedRoute>
                  <TeamList />
                </ProtectedRoute>
              } />
              <Route path="/teams/:teamId" element={
                <ProtectedRoute>
                  <TeamDetails />
                </ProtectedRoute>
              } />
              
              {/* Fallback route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MainLayout>
        </ToastContextProvider>
      </AuthProvider>
    </Router>
  );
}

export default App; 