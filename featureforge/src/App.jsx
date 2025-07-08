import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastContextProvider } from './components/ui/toast';
import { useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/common/ErrorBoundary';
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
import SignUpPage from './pages/SignUp';
import ResetPasswordPage from './pages/ResetPassword';
import NotFound from './pages/NotFound';
import Features from './pages/Features';
import FeatureView from './pages/FeatureView';
import NewFeature from './pages/NewFeature';
import { KanbanBoard } from './components/kanban';

// Smart root route component that redirects based on auth status
const RootRoute = () => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  // If user is logged in, redirect to team selector
  if (currentUser) {
    return <Navigate to="/selector" replace />;
  }
  
  // If not logged in, show the marketing home page
  return <Home />;
};

// Team access check component for routes that require a valid team selection
const RequireSelectedTeam = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const [hasSelectedTeam, setHasSelectedTeam] = useState(false);
  const [checkingTeam, setCheckingTeam] = useState(true);
  const location = useLocation();
  
  useEffect(() => {
    if (currentUser) {
      // Check if user has a selected team
      try {
        const selectedTeamId = localStorage.getItem('selectedTeamId');
        console.log('RequireSelectedTeam: selectedTeamId from localStorage:', selectedTeamId);
        setHasSelectedTeam(!!selectedTeamId);
      } catch (error) {
        console.error('RequireSelectedTeam: localStorage error -', error);
        setHasSelectedTeam(false);
      }
      setCheckingTeam(false);
    } else {
      setCheckingTeam(false);
    }
  }, [currentUser]);
  
  // For debugging
  console.log('RequireSelectedTeam state:', { 
    loading, 
    checkingTeam, 
    hasSelectedTeam, 
    currentUser: !!currentUser,
    path: location.pathname
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
    // Instead of showing TeamSelector, redirect to the selector page
    // This ensures the URL matches what's being shown
    console.log('RequireSelectedTeam: No selected team, redirecting to selector');
    return <Navigate to="/selector" state={{ from: location }} replace />;
  }
  
  console.log('RequireSelectedTeam: Has selected team, rendering children');
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastContextProvider>
          <div id="toast-container" /> {/* Container for direct toast calls */}
          <ErrorBoundary>
            <MainLayout>
              <Routes>
                {/* Smart root route - redirects logged-in users to selector */}
                <Route path="/" element={<RootRoute />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                
                <Route element={<ProtectedRoute />}>
                  {/* Dashboard now redirects to selector first */}
                  <Route path="/dashboard" element={<Navigate to="/selector" replace />} />
                  
                  {/* Direct access to team selector */}
                  <Route path="/selector" element={<TeamSelector />} />
                  
                  {/* Team management routes */}
                  <Route path="/teams" element={<TeamList />} />
                  <Route path="/teams/new" element={<TeamNew />} />
                  <Route path="/teams/:teamId" element={<TeamDetails />} />
                  
                  {/* Specific team dashboard - requires team selection */}
                  <Route path="/team-dashboard/:teamId" element={
                    <RequireSelectedTeam>
                      <Dashboard />
                    </RequireSelectedTeam>
                  } />
                  
                  {/* Feature management routes */}
                  <Route path="/features" element={
                    <RequireSelectedTeam>
                      <Features />
                    </RequireSelectedTeam>
                  } />
                  <Route path="/features/new" element={
                    <RequireSelectedTeam>
                      <NewFeature />
                    </RequireSelectedTeam>
                  } />
                  <Route path="/features/:featureId" element={
                    <RequireSelectedTeam>
                      <FeatureView />
                    </RequireSelectedTeam>
                  } />
                  
                  {/* Kanban Board */}
                  <Route path="/board" element={
                    <RequireSelectedTeam>
                      <KanbanBoard />
                    </RequireSelectedTeam>
                  } />
                </Route>
                
                {/* Fallback route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </MainLayout>
          </ErrorBoundary>
        </ToastContextProvider>
      </AuthProvider>
    </Router>
  );
}

export default App; 