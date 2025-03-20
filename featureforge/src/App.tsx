import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastContextProvider } from './components/ui/toast';
import { ProtectedRoute } from './components/auth';
import MainLayout from './components/layout/MainLayout';
import AuthContainer from './components/auth/AuthContainer';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';

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
              <Route path="/login" element={<AuthContainer />} />
              
              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/features" element={<div>Features Page (Coming Soon)</div>} />
              </Route>
              
              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </MainLayout>
        </ToastContextProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
