import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastContextProvider } from './components/ui/toast';
import { useAuth } from './contexts/AuthContext';
import MainLayout from './components/layout/MainLayout';
import AuthContainer from './components/auth/AuthContainer';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import TeamList from './components/teams/TeamList';
import TeamDetails from './components/teams/TeamDetails';
import TeamNew from './components/teams/TeamNew';
import TeamSelector from './components/teams/TeamSelector';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import Features from './pages/Features';
import FeatureView from './pages/FeatureView';
import NewFeature from './pages/NewFeature';

// Team route component that checks for team selection
const TeamRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const [hasSelectedTeam, setHasSelectedTeam] = useState(false);
  const [checkingTeam, setCheckingTeam] = useState(true);
  
  useEffect(() => {
    if (currentUser) {
      // Check if user has a selected team
      try {
        const selectedTeamId = localStorage.getItem('selectedTeamId');
        console.log('TeamRoute: selectedTeamId from localStorage:', selectedTeamId);
        setHasSelectedTeam(!!selectedTeamId);
      } catch (error) {
        console.error('TeamRoute: localStorage error -', error);
        setHasSelectedTeam(false);
      }
      setCheckingTeam(false);
    } else {
      setCheckingTeam(false);
    }
  }, [currentUser]);
  
  // For debugging
  console.log('TeamRoute state:', { 
    loading, 
    checkingTeam, 
    hasSelectedTeam, 
    currentUser: !!currentUser 
  });
  
  if (loading || checkingTeam) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  if (!hasSelectedTeam) {
    console.log('TeamRoute: No selected team, rendering TeamSelector');
    return <TeamSelector />;
  }
  
  console.log('TeamRoute: Has selected team, rendering children');
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
              
              <Route element={<ProtectedRoute />}>
                {/* Protected routes that require team selection */}
                <Route path="/dashboard" element={
                  <TeamRoute>
                    <Dashboard />
                  </TeamRoute>
                } />
                
                {/* Direct access to team selector */}
                <Route path="/selector" element={<TeamSelector />} />
                
                {/* Team management routes */}
                <Route path="/teams" element={<TeamList />} />
                <Route path="/teams/new" element={<TeamNew />} />
                <Route path="/teams/:teamId" element={<TeamDetails />} />
                
                {/* Feature management routes */}
                <Route path="/features" element={<Features />} />
                <Route path="/features/new" element={<NewFeature />} />
                <Route path="/features/:featureId" element={<FeatureView />} />
              </Route>
              
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